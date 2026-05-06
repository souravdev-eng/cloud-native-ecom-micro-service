# 06. Session Management

"Session" is an overloaded word. This chapter covers two distinct cases
that often live in Redis and treats them separately:

1. **Server-side sessions** — opaque session ID issued to the client,
   server stores associated state (user id, CSRF token, MFA state,
   per-session preferences).
2. **Token revocation / refresh-token store** — JWT-style stateless auth
   augmented by a small Redis-backed list of currently-valid or
   currently-revoked tokens.

Both are common; each has different correctness requirements.

---

## 6.1 Should the session be in Redis at all?

A purely stateless design (signed JWT, no server-side store) is the
simplest. Use it when:

- You can tolerate the session size in every request (cookies/headers).
- You do not need to revoke tokens before their natural expiry, or you
  accept short token lifetimes (≤15 min) plus a refresh-token rotation
  scheme.

Reach for Redis-backed sessions when at least one of the following
holds:

- Sessions need to be revoked instantly on logout, password change, or
  admin action.
- Per-session state is too large to round-trip on every request.
- You want an audit trail of active sessions per user
  ("Sessions logged in" UI).
- The session carries server-only data (CSRF tokens, MFA challenge
  state, partial-auth flows).

This platform's `auth/` service should use Redis for refresh tokens and
revocation lists; everything else can ride on signed JWTs.

---

## 6.2 Session ID requirements

A session ID is a security-critical token. It must be:

- **Unpredictable**: 128+ bits of CSPRNG output, base64-url encoded.
  Never derived from user data, timestamps, or sequential counters.
- **Bound to a transport**: an HTTP-only, `Secure`, `SameSite=Lax`
  (or `Strict`) cookie. Avoid putting session IDs in localStorage where
  XSS can read them.
- **Rotated** on privilege change (login, MFA upgrade, role change).
  Otherwise a session-fixation attack lets an attacker hand the victim
  a chosen session ID before authentication and inherit it after.

```ts
import { randomBytes } from 'crypto';

function newSessionId(): string {
  return randomBytes(32).toString('base64url'); // 256 bits
}
```

---

## 6.3 Storage shape

A session is a small object: store it as a Redis hash, one key per
session, with a TTL.

```
session:<id>            HASH   {userId, csrf, ip, ua, createdAt, mfa}
session:user:<userId>   SET    {<sessionId>, ...}        # active sessions for revocation
```

```ts
async function createSession(userId: string, meta: SessionMeta): Promise<string> {
  const id = newSessionId();
  const key = `session:${id}`;
  const idleTtlSec = 30 * 60;     // 30 min idle
  const absoluteTtlSec = 8 * 3600; // 8 h absolute (see §6.4)

  await client
    .multi()
    .hSet(key, {
      userId,
      csrf: randomBytes(16).toString('base64url'),
      ip: meta.ip,
      ua: meta.userAgent,
      createdAt: String(Date.now()),
      absoluteExpiresAt: String(Date.now() + absoluteTtlSec * 1000),
    })
    .expire(key, idleTtlSec)
    .sAdd(`session:user:${userId}`, id)
    .expire(`session:user:${userId}`, absoluteTtlSec)
    .exec();

  return id;
}
```

The `session:user:<userId>` set lets you enumerate or revoke all
sessions for a user. Without it, "log out everywhere" requires scanning
the keyspace.

---

## 6.4 Idle vs absolute timeout

Two timeouts must coexist:

- **Idle timeout** (e.g. 30 min): the session expires if not used.
  Implemented as the Redis TTL, refreshed on every access (`EXPIRE`).
- **Absolute timeout** (e.g. 8 h or 24 h): the session expires
  unconditionally regardless of activity. Implemented as a stored
  timestamp inside the hash; the application checks it on every read.

Without an absolute timeout, an attacker who steals a session can keep
it alive indefinitely by issuing one request per `idleTimeout - ε`.
Without an idle timeout, abandoned sessions on shared computers persist
for the full absolute window.

```ts
async function loadSession(id: string): Promise<Session | null> {
  const key = `session:${id}`;
  const data = await client.hGetAll(key);
  if (!data || !data.userId) return null;

  if (Date.now() > Number(data.absoluteExpiresAt)) {
    await destroySession(id);
    return null;
  }

  // Slide the idle window
  await client.expire(key, 30 * 60);

  return {
    userId: data.userId,
    csrf: data.csrf,
    /* ... */
  };
}
```

---

## 6.5 Rotation on privilege change

After any privilege change — login, MFA completion, role change, password
change — issue a **new** session ID and invalidate the old one. The
client receives the new ID via `Set-Cookie`; existing tokens are
unusable.

```ts
async function rotate(oldId: string): Promise<string> {
  const data = await client.hGetAll(`session:${oldId}`);
  await destroySession(oldId);
  return createSession(data.userId, {
    ip: data.ip,
    userAgent: data.ua,
  });
}
```

This is non-negotiable for login flows. It defeats session fixation
attacks at minimal cost.

---

## 6.6 Revocation

Two cases:

### Targeted revocation ("log out this session")

```ts
async function destroySession(id: string): Promise<void> {
  const userId = await client.hGet(`session:${id}`, 'userId');
  await client
    .multi()
    .del(`session:${id}`)
    .sRem(`session:user:${userId}`, id)
    .exec();
}
```

### Bulk revocation ("log out everywhere", "password changed")

```ts
async function revokeAll(userId: string): Promise<void> {
  const ids = await client.sMembers(`session:user:${userId}`);
  if (ids.length === 0) return;
  const tx = client.multi();
  for (const id of ids) tx.del(`session:${id}`);
  tx.del(`session:user:${userId}`);
  await tx.exec();
}
```

Trigger `revokeAll` on:

- Password change
- Email change with re-verification
- Suspicious-login security action
- Admin "force logout"

---

## 6.7 Refresh tokens (JWT pattern)

If the platform uses short-lived access JWTs (5–15 min) plus long-lived
refresh tokens, store **only the refresh token** server-side. The access
token remains stateless and self-contained.

```
auth:refresh:<tokenId>            HASH   {userId, family, issuedAt}
auth:refresh:user:<userId>        SET    {<tokenId>, ...}
auth:refresh:family:<familyId>    HASH   {revokedAt}    # for reuse detection
```

Critical property: **detect token reuse**. When a refresh token is
exchanged, mark it consumed. If the same token is presented twice, the
second presentation is either a replay attack or a stolen token — revoke
the entire token *family* (every refresh issued in that login chain).

```ts
const REFRESH_LUA = `
  local data = redis.call('HMGET', KEYS[1], 'userId', 'family')
  local userId, family = data[1], data[2]
  if not userId then return {0, 'unknown'} end

  if redis.call('EXISTS', KEYS[2]) == 1 then
    -- family already revoked; refuse
    return {0, 'revoked'}
  end

  -- Single-use: delete the presented token
  redis.call('DEL', KEYS[1])
  redis.call('SREM', KEYS[3], ARGV[1])
  return {1, userId, family}
`;
```

If a deletion fails (token already consumed), promote the family to
revoked and force re-authentication. This is the mechanism that limits
the blast radius of a leaked refresh token.

---

## 6.8 CSRF tokens

For cookie-bound sessions, every state-changing request must carry a
CSRF token (header or form field) that matches a value stored in the
session hash. Generate at session creation, rotate at privilege change,
include in the response for the SPA to read once via a `/csrf` endpoint.

The simplest correct implementation is the **double-submit cookie**
pattern with a session-bound secret, not a stateless one — the latter is
weaker against subdomain XSS.

---

## 6.9 What not to put in the session

- **Permissions / role state** in serialised form. Look up roles fresh
  from the SoR per request (cached separately with short TTL). A session
  surviving a role downgrade is a privilege-escalation bug.
- **Large user objects**. Store a `userId` and load the rest. Keep
  session payloads under ~4 KB.
- **Anything you would not want in a memory dump**. Redis is in-memory
  and may be persisted to disk (RDB) if AOF is on. Plaintext passwords,
  full PANs, and similar must not be in session state.

---

## 6.10 Eviction and durability

Sessions on a shared cache instance can be evicted under memory pressure
(`maxmemory-policy=allkeys-lru`), which silently logs users out. Two
mitigations:

- **Dedicated Redis instance for auth/sessions**, sized so it never hits
  `maxmemory`. Use `volatile-ttl` or `noeviction` policy. Cache and
  session workloads have different durability requirements; collocating
  them is operationally error-prone.
- **AOF on for the session instance**, with `appendfsync everysec`.
  After a primary failover, recently-issued sessions remain valid. RDB
  alone may lose minutes of sessions.

---

## 6.11 Concurrency: sliding TTL race

Two concurrent requests for the same session both want to slide the TTL
and update `lastAccess`. Without atomicity, one update can be lost.

For the TTL alone, `EXPIRE` is idempotent — running it from two clients
just sets the same value. For `lastAccess` updates that must reflect the
true last access, use `HSET` with the request's timestamp; the highest
timestamp wins, which is acceptable. For more complex concurrent updates
(MFA challenge state during login), use a Lua script.

---

## 6.12 Observability

- `session_create_total{reason="login|mfa|rotate"}`
- `session_destroy_total{reason="logout|expire|revokeAll|rotate"}`
- `active_sessions` (gauge, sampled — `DBSIZE`-style estimate)
- `refresh_token_reuse_detected_total` — alert on any non-zero rate; this
  is a security signal.

---

## 6.13 Continue

- [03. Cache Invalidation](./03-cache-invalidation.md) — applies to permission/role caches that sit alongside sessions.
- [08. Production Patterns](./08-production-patterns.md) — persistence and isolation choices for the auth Redis instance.
