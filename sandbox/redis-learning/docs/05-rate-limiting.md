# 05. Rate Limiting

Rate limiting bounds the rate at which a caller may consume a resource.
The right algorithm depends on the *shape* of the limit you want to
enforce — and the wrong choice produces either user-visible bursts or
unnecessary rejections.

This chapter covers the four algorithms that matter, atomic Redis
implementations of each, and the operational concerns specific to
multi-instance deployments.

---

## 5.1 Choose what you mean by "rate"

Before writing code, decide:

| Question | Implication |
|----------|-------------|
| Per what? IP, user, API key, tenant, route? | Each "what" is a separate key prefix. |
| Hard cap (reject) or soft (queue/throttle)? | Different mechanism — this chapter covers hard caps. |
| Burst tolerance? | Token bucket allows bursts; sliding window does not. |
| Window length? | Short windows are precise but rejections feel arbitrary; long windows allow huge bursts at edges. |
| What happens at the limit? | 429 with `Retry-After`? Drop silently? Degrade? |

A common mistake is using "100 requests per minute" without specifying
*which* algorithm interprets that. The number alone is ambiguous.

---

## 5.2 Algorithm catalogue

### Fixed window counter

Increment a counter keyed by `(actor, window)`. When the counter
exceeds the limit, reject. The counter expires at window end.

```ts
const FIXED_WINDOW_LUA = `
  local current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
  end
  if current > tonumber(ARGV[1]) then return 0 end
  return 1
`;

export async function fixedWindow(
  actor: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const key = `rl:fixed:${actor}:${bucket}`;
  const r = await client.eval(FIXED_WINDOW_LUA, {
    keys: [key],
    arguments: [String(limit), String(windowSec)],
  });
  return r === 1;
}
```

**Properties**: `O(1)` time and space, atomic via Lua.

**Failure mode — boundary burst**: a caller can send `limit` requests in
the last 1 ms of one window and another `limit` in the first 1 ms of
the next, producing 2× the intended rate. For abuse-resistance, prefer
sliding window or token bucket.

### Sliding window log

Store the timestamp of every request in a sorted set; count entries
within the window:

```ts
const SLIDING_LOG_LUA = `
  local now = tonumber(ARGV[1])
  local windowStart = now - tonumber(ARGV[2])
  redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, windowStart)
  local count = redis.call('ZCARD', KEYS[1])
  if count >= tonumber(ARGV[3]) then return 0 end
  redis.call('ZADD', KEYS[1], now, now .. ':' .. ARGV[4])
  redis.call('EXPIRE', KEYS[1], math.ceil(tonumber(ARGV[2]) / 1000))
  return 1
`;
```

**Properties**: exact, no boundary burst.

**Failure mode — memory**: every request stores an entry. At 1,000 rps
sustained, a 1-minute window is 60,000 entries per actor. For high-rate
limits across many actors this is expensive. Use only when precision
matters and the rate is modest.

### Sliding window counter (approximate)

A weighted blend of two adjacent fixed windows. If the previous window
was `prev` and the current is `curr`, and we are 30% into the current
window, the effective count is `0.7 * prev + curr`.

```ts
const SLIDING_COUNTER_LUA = `
  local now = tonumber(ARGV[1])
  local windowMs = tonumber(ARGV[2])
  local limit = tonumber(ARGV[3])
  local currKey = KEYS[1]
  local prevKey = KEYS[2]

  local elapsed = now % windowMs
  local weight = 1 - (elapsed / windowMs)
  local prev = tonumber(redis.call('GET', prevKey) or '0')
  local curr = tonumber(redis.call('GET', currKey) or '0')

  local estimate = math.floor(prev * weight + curr)
  if estimate >= limit then return 0 end

  redis.call('INCR', currKey)
  redis.call('PEXPIRE', currKey, windowMs * 2)
  return 1
`;
```

**Properties**: `O(1)` time and space, low memory, smoothes the boundary
burst. Slight inaccuracy at window edges (within ~few percent) is the
trade-off.

This is the algorithm Cloudflare published in 2017 and is the right
default for general-purpose API rate limiting at scale.

### Token bucket

A bucket holds up to `capacity` tokens, refilled at `refillRate` per
second. Each request consumes a token; if none available, reject. Allows
controlled bursting up to `capacity`.

```ts
const TOKEN_BUCKET_LUA = `
  local capacity = tonumber(ARGV[1])
  local refillPerMs = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local cost = tonumber(ARGV[4])

  local data = redis.call('HMGET', KEYS[1], 'tokens', 'updatedAt')
  local tokens = tonumber(data[1])
  local updatedAt = tonumber(data[2])
  if tokens == nil then
    tokens = capacity
    updatedAt = now
  end

  local elapsed = math.max(0, now - updatedAt)
  tokens = math.min(capacity, tokens + elapsed * refillPerMs)

  local allowed = 0
  if tokens >= cost then
    tokens = tokens - cost
    allowed = 1
  end

  redis.call('HSET', KEYS[1], 'tokens', tokens, 'updatedAt', now)
  redis.call('PEXPIRE', KEYS[1], math.ceil(capacity / refillPerMs) + 1000)
  return { allowed, tokens }
`;
```

**Properties**: explicit burst control, fair, the standard choice for
"sustained N rps with bursts up to M" requirements.

### GCRA (Generic Cell Rate Algorithm)

A constant-memory equivalent to a leaky bucket, used by Stripe and many
others. Stores a single timestamp per actor (the "theoretical arrival
time") rather than a counter. Equivalent in behaviour to a token bucket
with `cost=1` but more memory-efficient.

```ts
const GCRA_LUA = `
  local emissionInterval = tonumber(ARGV[1]) -- ms per token
  local burstTolerance = tonumber(ARGV[2])   -- ms of burst allowed
  local now = tonumber(ARGV[3])

  local tat = tonumber(redis.call('GET', KEYS[1]) or now)
  local newTat = math.max(now, tat) + emissionInterval
  local allowAt = newTat - burstTolerance
  if now < allowAt then
    return { 0, allowAt - now } -- rejected; retry after ms
  end
  redis.call('SET', KEYS[1], newTat, 'PX', math.ceil(burstTolerance + emissionInterval))
  return { 1, 0 }
`;
```

GCRA is the algorithm to reach for when memory-per-actor matters and you
want exact behaviour: one string per actor, no counters or sets.

---

## 5.3 Choosing among them

| You want... | Use |
|-------------|-----|
| Cheapest, fixed windows acceptable | Fixed window |
| Exact count, low rates | Sliding window log |
| Smoothed boundaries, scale | Sliding window counter (default) |
| Configurable burst, sustained rate | Token bucket |
| Minimal memory, exact behaviour | GCRA |

For login throttling in `auth/`, use **token bucket** keyed on
(IP, username) so legitimate users get small bursts while attackers
hit the wall fast.

For per-route API rate limits, **sliding window counter** scales
cheaply.

For per-tenant write throttles where bursts must be contained,
**GCRA** or token bucket with capacity = 1× window allowance.

---

## 5.4 Atomicity

Every algorithm above must be atomic with respect to other clients.
Read-modify-write across multiple commands without `MULTI`/`WATCH` or a
Lua script is wrong: two concurrent callers can both observe the count
below limit and both increment past it.

**Always use a Lua script** for non-trivial limiters. Load once with
`SCRIPT LOAD`, store the SHA, dispatch with `EVALSHA`. Keep scripts
short — they block the main thread.

```ts
const sha = await client.scriptLoad(SLIDING_COUNTER_LUA);

export async function check(actor: string): Promise<boolean> {
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = Math.floor(now / windowMs);
  const r = await client.evalSha(sha, {
    keys: [`rl:${actor}:${bucket}`, `rl:${actor}:${bucket - 1}`],
    arguments: [String(now), String(windowMs), String(LIMIT)],
  });
  return r === 1;
}
```

Handle `NOSCRIPT` errors by reloading the script and retrying — primary
failover or `SCRIPT FLUSH` clears the cache:

```ts
async function evalShaWithFallback(...) {
  try {
    return await client.evalSha(sha, ...);
  } catch (err) {
    if (String(err).includes('NOSCRIPT')) {
      sha = await client.scriptLoad(SCRIPT);
      return client.evalSha(sha, ...);
    }
    throw err;
  }
}
```

---

## 5.5 Failing open vs failing closed

When Redis is unavailable, the limiter cannot make a decision. Choose
deliberately:

- **Fail open** (allow the request) — preserves availability. Appropriate
  for soft limits where the consequence of an over-limit request is
  small (general API rate-limiting, marketing endpoints).
- **Fail closed** (reject the request) — preserves the protected
  resource. Appropriate for security-critical limits (login attempts,
  password reset, payment retries).

Implement explicitly; do not rely on the default behaviour of catching an
exception. Wrap the call:

```ts
async function checkOrFail(actor: string): Promise<{ allowed: boolean }> {
  try {
    return { allowed: await check(actor) };
  } catch (err) {
    metrics.incr('rate_limit_redis_error');
    return { allowed: FAIL_OPEN };
  }
}
```

Document the choice for each limiter in the codebase.

---

## 5.6 Multi-replica considerations

In Sentinel mode, the rate limiter runs on the primary. During failover
(seconds-scale), `EVALSHA` calls fail and the application must decide:
fail open, fail closed, or wait. A fail-open default is usually correct
for non-security limiters; the failover window is short.

In Cluster mode, the limiter key must hash to a single slot. For a
multi-key script (sliding window counter uses `currKey` and `prevKey`),
both keys must share a hash tag:

```
rl:{user:42}:6789
rl:{user:42}:6790
```

Without the `{...}` tag, the keys hash to different slots and the script
fails with `CROSSSLOT`.

---

## 5.7 Returning useful information to clients

A 429 response should include actionable information:

```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 23
Retry-After: 23
```

`RateLimit-*` headers (RFC 9745 draft) are increasingly standard. For
GCRA, `Retry-After` is the second return value of the script. For
sliding window counter, compute remaining time-in-window. Always provide
some signal — clients without it will hammer the endpoint.

---

## 5.8 Worked example — auth login throttle

`auth/` should throttle failed logins to defend against credential
stuffing. The right shape is **token bucket per (ip, username)** with:

- Capacity ~5 (small burst allowed for typo retries).
- Refill ~5 / 5 minutes (1 token/min) for sustained rate.
- Reset on successful authentication.

```ts
// On every login attempt
const allowed = await tokenBucket.consume(`auth:login:${ip}:${username}`, {
  capacity: 5,
  refillPerSec: 1 / 60,
  cost: 1,
});
if (!allowed) {
  return res.status(429).set('Retry-After', '60').end();
}

// On success
await client.del(`auth:login:${ip}:${username}`);
```

Layer with a coarser global IP limit (sliding window counter, e.g.
60/min/IP) so that a single IP cannot exhaust the per-username buckets
across many usernames.

---

## 5.9 Observability

Per limiter:

- `rate_limit_decisions_total{limiter, outcome="allow|deny|error"}`
- `rate_limit_remaining{limiter}` — gauge, sampled on allow
- `rate_limit_redis_errors_total{limiter}`

Alert when `outcome="error"` rate exceeds a small threshold — silent
failure of the limiter is a security incident if you fail open.

---

## 5.10 Continue

- [04. Distributed Locks](./04-distributed-locks.md) — same Lua/atomicity machinery.
- [08. Production Patterns](./08-production-patterns.md) — Cluster slot routing for multi-key limiter scripts.
