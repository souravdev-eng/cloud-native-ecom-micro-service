# 04. Distributed Locks

Distributed locks coordinate exclusive access to a resource across
processes that share no memory. Redis-based locks are common because they
are fast and easy to implement; they are also widely implemented
incorrectly. This chapter covers the correct primitive, what it does and
does not guarantee, and when not to use Redis at all.

---

## 4.1 What you actually need

Before reaching for a lock, classify the problem:

1. **Idempotency** — can the operation be made safe to repeat? An
   `INSERT ... ON CONFLICT DO NOTHING` keyed by an idempotency token is
   simpler and stronger than a lock. Always prefer this when possible.
2. **Optimistic concurrency** — can a version column on the row prevent
   conflicting writes? A `WHERE version = $expected` is a non-distributed
   lock with no liveness risk.
3. **Single-flight, not mutual exclusion** — do you just want one
   process to do the work? A best-effort Redis lock is sufficient even
   if it occasionally double-fires.
4. **Strict mutual exclusion** — does correctness require that *at most
   one* holder ever runs the critical section? Redis cannot give you
   this without fencing tokens (§4.6), and even then you must understand
   the failure modes. For strict mutual exclusion of money-affecting
   operations, use Postgres advisory locks, a row-level lock with
   `SELECT ... FOR UPDATE`, or a real consensus system (etcd, ZooKeeper).

The locks described in this chapter are appropriate for cases (3) and,
with care, (4) when the critical section can tolerate the failure modes
documented in §4.7–§4.8.

---

## 4.2 The minimum correct primitive

```ts
import { randomUUID } from 'crypto';

async function acquire(key: string, ttlMs: number): Promise<string | null> {
  const token = randomUUID();
  const ok = await client.set(key, token, { NX: true, PX: ttlMs });
  return ok === 'OK' ? token : null;
}
```

Three properties are essential:

- **`NX`** — set only if the key does not already exist. Without it,
  every caller overwrites the previous holder's value.
- **`PX`** (or `EX`) — set with an expiry. Without it, a holder that
  crashes before releasing leaves the lock stuck forever (deadlock).
- **A unique token** — the value is a random per-acquisition identifier,
  not a constant. The release path verifies it before deleting.

Anything that omits any of these three is wrong. The classic bug
("`SETNX` then `EXPIRE`") is wrong because the two commands are not
atomic; `SET ... NX PX` is the atomic version and has been the correct
primitive since Redis 2.6.12.

---

## 4.3 Releasing safely

Releasing must be conditional on still holding the lock. A naive `DEL`
deletes whoever currently holds it — including a different caller who
acquired the lock after yours expired. Use a Lua script:

```ts
const RELEASE_LUA = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  else
    return 0
  end
`;

async function release(key: string, token: string): Promise<boolean> {
  const result = await client.eval(RELEASE_LUA, {
    keys: [key],
    arguments: [token],
  });
  return result === 1;
}
```

The script is atomic on the server: no other client can acquire the lock
between the `GET` and the `DEL`.

---

## 4.4 Wrapper

Locking code in production almost always wants automatic release on
both success and failure paths:

```ts
export async function withLock<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T | null> {
  const token = await acquire(key, ttlMs);
  if (!token) return null; // could not acquire; caller decides what to do

  try {
    return await fn();
  } finally {
    await release(key, token).catch((err) => {
      // Lock will expire naturally; failure to release is non-fatal.
      log.warn({ err, key }, 'lock release failed');
    });
  }
}
```

Callers should treat `null` as "not acquired" and decide whether to
retry, fail fast, or skip the work entirely. **Do not loop forever
trying to acquire** — bound retries and budget them within the request
deadline.

---

## 4.5 Picking the TTL

The TTL is the upper bound on how long the lock can be held. Two
opposing forces:

- **Too short**: the work outlives the lock; another caller acquires it
  while the first is still running. The first caller's `release` will
  refuse to delete (the token mismatches), but the critical section is
  already concurrent.
- **Too long**: a crashed holder blocks progress for the full TTL.

Choose `TTL = max_expected_runtime × safety_factor`, with a typical
safety factor of 2–5. If the work can legitimately take longer than the
TTL, **extend the lock** rather than picking a generous fixed value:

```ts
// Periodically extend while still working
async function extend(key: string, token: string, ttlMs: number): Promise<boolean> {
  const EXTEND_LUA = `
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      return redis.call('PEXPIRE', KEYS[1], ARGV[2])
    else
      return 0
    end
  `;
  const r = await client.eval(EXTEND_LUA, {
    keys: [key],
    arguments: [token, String(ttlMs)],
  });
  return r === 1;
}
```

Run a watchdog that calls `extend` on a fraction of the TTL (e.g. every
TTL/3). If `extend` returns 0 you have lost the lock — abort the work
immediately. The watchdog must stop the moment the work completes or
errors.

---

## 4.6 Fencing tokens — the part Redis cannot give you

Even with the correct primitive, Redis locks have a fundamental
weakness: there is no way for the **resource being protected** to know
which lock holder is current.

Scenario:

1. `A` acquires the lock.
2. `A` pauses (GC, I/O stall, kernel scheduling).
3. The lock TTL elapses.
4. `B` acquires the lock and starts work.
5. `A` resumes and continues, unaware its lock expired. Now both `A` and
   `B` are operating on the resource.

Releasing safely (§4.3) does not help: `A` may have already issued
writes against the resource between steps 2 and 5.

The textbook fix (Kleppmann) is **fencing tokens**: each acquisition
returns a monotonically increasing token, and the protected resource
rejects writes carrying a token lower than the highest seen.

Redis does not provide monotonically increasing tokens directly. You can
approximate one with `INCR fence:<resource>` alongside the lock, but the
**resource** must check the token. If the resource is Postgres, that
means every write carries the token and the table has a `last_fence`
column the write checks against. At that point, you have already
implemented optimistic concurrency in Postgres, and the Redis lock is
redundant — you can drop it.

**The practical rule**: Redis locks are safe when a stale holder cannot
do harm. Examples:

- Cache rebuilds (a stale rebuild merely writes the same value twice).
- Cron jobs where double-execution is wasteful but not corrupt.
- Triggering an idempotent external API call with a known idempotency
  key.

They are unsafe — without resource-side fencing — when concurrent
holders can violate an invariant: financial debits, inventory
reservation without idempotency, file rename sequences. For those
cases, push the exclusion into the SoR (Postgres advisory lock or row
lock) where fencing is implicit.

---

## 4.7 Redlock — what it does and does not solve

Antirez's **Redlock** algorithm acquires the same lock on `N` independent
Redis primaries (typically 5) and considers it held when a majority
respond within a time bound. The intent is to tolerate single-node
failure and limit clock-skew issues.

Redlock is controversial. Martin Kleppmann's critique
("How to do distributed locking", 2016) argues it does not actually
provide the safety it claims because the underlying assumptions about
clocks and process pauses are unsafe. Antirez's response
("Is Redlock safe?", 2016) refines but does not fully refute the
critique. **Read both before adopting Redlock.**

Practical guidance:

- **For 99% of needs in this platform, single-instance `SET NX PX`
  suffices.** A single Redis primary backed by Sentinel (Chapter 08) is
  highly available enough; the marginal safety benefit of Redlock is
  smaller than the operational cost of running and reasoning about five
  independent Redis instances.
- **For genuinely critical mutual exclusion**, do not use Redlock; use
  the SoR (Postgres) or a real consensus system. The "Redlock vs etcd"
  comparison usually ends with etcd winning on safety and Redis winning
  on simplicity for non-safety-critical work.

---

## 4.8 Failure modes summary

| Failure | What happens | Mitigation |
|---------|--------------|------------|
| Holder crashes | Lock expires after TTL | Use a TTL; that is the point |
| Holder pauses past TTL | Two concurrent holders | Watchdog `extend`, idempotent work, or fencing in SoR |
| Network partition between holder and Redis | Holder thinks it has the lock; Redis disagrees | Heartbeat the lock; abort work if `extend` fails |
| Redis primary fails over | Newly elected primary may not have the key (async replication) | Accept brief double-acquisition window or use Redlock with full understanding of trade-offs |
| Release deletes wrong holder | Critical-section interleaving | Token-checked Lua release (§4.3) — required |
| Clock skew on Redis | Lock expires earlier or later than expected | Bound TTL conservatively; rely on `PEXPIRE` semantics, not wall clock comparison |

---

## 4.9 Concrete uses in this platform

Examples where a Redis lock is the right tool:

### Order service — flash sale rebuild

When a flash-sale catalog is rebuilt, you want exactly one rebuilder per
cluster, but a double-rebuild is merely wasteful, not corrupt. Use a
single-instance lock with a watchdog.

```ts
await withLock('rebuild:flash-sale', 5 * 60_000, async () => {
  await rebuildFlashSaleCatalog();
});
```

### ETL service — periodic ingest

`@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/etl-service`
runs scheduled jobs. If the deployment scales to >1 replica, only one
should run a given job at a time. The job is idempotent (or should be);
the lock prevents wasted work, not correctness violations.

### Product service — single-flight cache load

Cross-pod request coalescing on hot keys (Chapter 02 §2.7). The cost of
double-loading is one extra Postgres query — purely a load concern, no
correctness risk. A short-TTL lock is appropriate.

### What *not* to use a Redis lock for

- **Inventory reservation** in `order/`. Use Postgres row-level locks
  (`SELECT ... FOR UPDATE`) or a `quantity_remaining` column with a
  conditional update. Money is at stake; do not gamble on lock semantics.
- **Idempotent payment retries**. Use an idempotency key stored in
  Postgres with a unique constraint. The DB rejects the duplicate; no
  lock needed.

---

## 4.10 Observability

Per lock key, export:

- `lock_acquire_total{key, outcome="acquired|busy|error"}`
- `lock_hold_seconds{key}` — histogram of held time
- `lock_extend_total{key, outcome="ok|lost|error"}`
- `lock_release_total{key, outcome="ok|stale|error"}`

`outcome="stale"` on release (token mismatch) is the leading indicator
of TTL-too-short or watchdog failure. If it is non-zero, tune.

---

## 4.11 Reference Lua scripts

```lua
-- acquire is just SET key token NX PX ttl, no script needed.

-- release.lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0
end

-- extend.lua
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('PEXPIRE', KEYS[1], ARGV[2])
else
  return 0
end
```

Load once with `SCRIPT LOAD`, store the SHA, and dispatch with `EVALSHA`
on every call.

---

## 4.12 Further reading

- Antirez, *Distributed locks with Redis*: <https://redis.io/docs/latest/develop/use/patterns/distributed-locks/>
- Martin Kleppmann, *How to do distributed locking* (2016)
- Antirez, *Is Redlock safe?* (2016)

---

## 4.13 Continue

- [05. Rate Limiting](./05-rate-limiting.md) — atomic counter patterns that share the Lua-script idiom.
- [08. Production Patterns](./08-production-patterns.md) — replication and failover behaviour that constrains lock safety.
