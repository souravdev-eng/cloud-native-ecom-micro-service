## Auth Hardening Plan

**TL;DR:** Add Redis-backed sessions for refresh tokens, rotate on every refresh with reuse detection, apply login rate limits, and emit structured logs/metrics.

### Scope

- Refresh token rotation + reuse detection
- Redis session store (hashed tokens)
- Login rate limiting (IP + username)
- Structured logs, metrics, basic alerts

---

### Redis Session Store

- Key: `sess:{userId}:{sessionId}` (TTL = refresh token TTL)
- Value:

```json
{
  "familyId": "uuid",
  "tokenHash": "sha256(refreshToken)",
  "createdAt": "ISO",
  "expiresAt": "ISO",
  "ua": "user-agent",
  "ip": "ip-address",
  "revoked": false
}
```

- Index helpers (optional):
  - `sessfam:{userId}:{familyId}` → Set of `sessionId` (for fast family revoke)

---

### Token Rotation + Reuse Detection

Flow:

1. On login: create `familyId`, `sessionId`, issue `{access, refresh}`, store `tokenHash` in Redis.
2. On refresh:
   - Verify JWT signature/claims → extract `userId`, `sessionId`, `familyId`.
   - Fetch `sess:{userId}:{sessionId}`.
   - If key missing → invalid/expired → 401.
   - If `sha256(presentedRefresh) != tokenHash` → reuse detected → revoke entire family (DEL all sessions in `sessfam`), 401 + security event.
   - Else: issue new refresh, rotate `tokenHash`, extend TTL, return new `{access, refresh}`.
3. On logout: DEL `sess:{userId}:{sessionId}` and remove from `sessfam`.

Pseudo (TypeScript-ish):

```ts
// on refresh
const sessKey = `sess:${userId}:${sessionId}`;
const sess = await redis.get(sessKey);
if (!sess) throw unauthorized();

const presentedHash = sha256(refreshToken);
if (presentedHash !== sess.tokenHash) {
  await revokeFamily(userId, sess.familyId); // DEL all family sessions
  emitSecurityEvent('refresh_reuse_detected', { userId, familyId: sess.familyId });
  throw unauthorized();
}

const newRefresh = signRefresh({ userId, sessionId, familyId });
await redis.set(sessKey, { ...sess, tokenHash: sha256(newRefresh) }, 'EX', refreshTtlSeconds);
return { access: signAccess({ userId }), refresh: newRefresh };
```

Rollback note: keep rotation behind a feature flag `AUTH_ROTATE_REFRESH=true`. Disable to revert to current behavior quickly.

---

### Login Rate Limiting

- Per-IP limiter on `/api/auth/login`:
  - Window: 15m, Max: 20
- Per-username failure counter:
  - Key: `loginfail:{username}` → increment on failure, EX=15m; block > N (e.g., 5) for 15m

Example (Express):

```ts
import rateLimit from 'express-rate-limit';

export const loginIpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth/login', loginIpLimiter);

// On failed login attempt:
await redis.incr(`loginfail:${username}`);
await redis.expire(`loginfail:${username}`, 15 * 60);
```

---

### JWT Claims & Validation

- Access token (5–15 min): `{ sub, aud, scope[], iat, exp, ver }`
- Refresh token (longer TTL): `{ sub, sid, fid, iat, exp }` where `sid=sessionId`, `fid=familyId`
- Validate `aud` and `scope` in gateway; bump `ver` (tokenVersion) to globally invalidate.

---

### Observability

- Logs (JSON): include `{ requestId, userId, sessionId, ip, ua }` on login/refresh/logout.
- Metrics:
  - `auth_login_attempts_total`
  - `auth_login_success_total`
  - `auth_refresh_reuse_detected_total`
  - `auth_sessions_active_gauge`
- Alert: page on spike of `auth_refresh_reuse_detected_total` or 5xx rate on `/login`.

---

### Implementation Checklist

- [ ] Add Redis client and config (auth service).
- [ ] Implement session store helpers (get/set/del, family revoke).
- [ ] Issue `familyId`/`sessionId` on login; persist hashed refresh token.
- [ ] Implement refresh rotation + reuse detection.
- [ ] Add per-IP & per-username rate limiting for `/login`.
- [ ] Emit structured logs + metrics; wire basic alerts.
- [ ] Add tests: rotation success, reuse revoke, rate limit lockout.

---

### Minimal Env Vars

```
REDIS_URL=redis://redis:6379
ACCESS_TOKEN_TTL_MIN=15
REFRESH_TOKEN_TTL_DAYS=30
AUTH_ROTATE_REFRESH=true
```
