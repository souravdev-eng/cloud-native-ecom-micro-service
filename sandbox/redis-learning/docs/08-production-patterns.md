# 08. Production Patterns

This chapter covers everything that determines whether Redis stays up
and stays fast under load: persistence, replication, capacity, eviction,
observability, security, and the operational practices that prevent
incidents.

---

## 8.1 Topology choices

Three deployment shapes, in increasing order of operational cost:

| Topology | Use when | Trade-off |
|----------|----------|-----------|
| **Single instance** | Dev, low-stakes caches | No HA; data lost on host failure |
| **Primary + replicas + Sentinel** | Most production caches and small workloads | Failover takes seconds; async replication can lose recent writes |
| **Cluster** | Dataset > a single host's RAM, or write throughput > a single primary | Multi-key operations require hash tags; resharding is non-trivial |

Default for this platform: **Primary + 1–2 replicas + Sentinel**, one
deployment per logical workload class (cache, sessions, queues if any).
Move to Cluster only when capacity demands it.

The Kubernetes manifests under
`@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/k8s`
should reflect this — separate StatefulSets per workload class, with
`maxmemory` and `maxmemory-policy` set explicitly per workload, not
inherited from a default.

---

## 8.2 Persistence: RDB, AOF, both, neither

Redis supports two persistence mechanisms:

- **RDB** — periodic point-in-time snapshots (binary). Fast restart,
  small files, may lose the last `save` interval on crash.
- **AOF** — append-only log of every write command. Replayed on startup.
  Loses at most 1 second of writes (`appendfsync everysec`) or zero
  (`appendfsync always`, costly).

| Workload | Recommended |
|----------|-------------|
| Pure cache (`product/`) | No persistence, or RDB only at low frequency. Cache is rebuildable. |
| Sessions, refresh tokens | AOF `everysec` + RDB. Losing minutes of sessions is unacceptable. |
| Rate-limit counters | No persistence. Counters reset on restart; the missed window is brief. |
| Job queues / streams | AOF `everysec`. Treat queue loss as a real incident. |
| Coordination / locks | No persistence. A surviving lock from before a crash is worse than starting fresh. |

Hybrid persistence (`aof-use-rdb-preamble yes`, default in modern Redis)
combines both: AOF rewrite produces an RDB-format prefix plus an AOF
suffix, giving fast load and bounded recent-write loss. Use it when AOF
is on.

Performance note: RDB save and AOF rewrite both `fork()` the Redis
process. On a 10 GB Redis instance, the fork copies the page table and
copy-on-write activity briefly inflates RAM usage. Provision the host
with at least 1.5× `maxmemory` of physical RAM, or set `save ""` and run
backups from a replica.

---

## 8.3 Replication and failover

A replica is an asynchronous copy of the primary. Replication is:

- **Asynchronous** — writes acknowledged on the primary may not yet be
  on replicas. After failover, those writes are lost.
- **Eventually consistent** — under load, replication can lag.
- **Best-effort** — partial resynchronisation works for short
  disconnects; longer ones force a full sync (a fresh RDB copy).

Sentinel monitors the primary and promotes a replica on failure. Tune:

- `down-after-milliseconds` — how long unreachable counts as down. Too
  low triggers spurious failovers under transient network issues; too
  high extends outages. 5,000 ms is a reasonable default.
- `failover-timeout` — backoff between failover attempts.
- `quorum` — minimum Sentinels required to agree. With 3 Sentinels, set
  to 2.

After failover, clients must reconnect. Both `node-redis` and `ioredis`
support Sentinel-aware connections — use them, do not manually parse
discovery.

---

## 8.4 Cluster

Redis Cluster shards the keyspace across N primaries (16,384 hash
slots). Each primary may have replicas. There is no central
coordinator; clients are slot-aware and route requests directly.

Key constraints:

- **Multi-key operations** (`MSET`, `MGET`, transactions, Lua scripts
  with multiple `KEYS`) require all keys to live on the same shard.
  Achieve this by putting a common substring in `{}`:
  `{cart:user:42}:items` and `{cart:user:42}:meta` hash to the same
  slot. Without `{}`, keys distribute across slots.
- **Resharding** moves slots between primaries. It is online but
  competes for CPU; schedule for low traffic.
- **Pub/Sub** is shard-scoped in Cluster: `PUBLISH` on one shard does
  not deliver to subscribers on another. Use sharded Pub/Sub
  (`SPUBLISH`/`SSUBSCRIBE`, Redis 7+) or move to RabbitMQ for
  cross-service signalling.

Move to Cluster when:

- The dataset exceeds ~50% of a host's RAM, leaving no headroom.
- A single primary's CPU or network is saturated under expected peak.
- You can refactor multi-key operations to use hash tags.

If the answer is "we just want HA", Sentinel is the simpler choice.

---

## 8.5 Memory and capacity

`maxmemory` is the soft upper bound on dataset size. `maxmemory-policy`
decides what happens when reached.

Policies:

| Policy | Behaviour | Use when |
|--------|-----------|----------|
| `noeviction` | Reject writes with OOM error | Coordination/queue instances where eviction would be a correctness bug |
| `allkeys-lru` | Evict least-recently-used across all keys | Pure cache where every key is dispensable |
| `allkeys-lfu` | Evict least-frequently-used | Cache with skewed access patterns |
| `volatile-lru` | LRU among keys with TTL | Mixed workloads — but prefer dedicated instances |
| `volatile-ttl` | Evict keys nearest expiry | Session-like workloads |
| `allkeys-random` / `volatile-random` | Random | Avoid; use only when access patterns are uniform |

**Default for cache**: `allkeys-lfu`. LFU's frequency tracking matches
how real caches are accessed (a few keys are extremely hot, most are
cold) better than LRU.

**For mixed workloads**, do not. Run separate Redis instances per
workload class. Eviction-as-bug is not a hypothetical: a `volatile-lru`
instance hosting both cache and sessions can evict a session before its
TTL when memory pressure spikes.

### Sizing

Memory budget = working set + replication overhead + fork headroom +
slack.

- Working set: estimate from `MEMORY USAGE` on representative keys × key
  count.
- Replication overhead: ~`client-output-buffer-limit replica` worth of
  buffer per replica during full sync.
- Fork headroom: up to 1× working set briefly during AOF rewrite or RDB
  save under heavy write load.
- Slack: 20–30%. Hitting `maxmemory` triggers eviction; eviction takes
  CPU on the main thread and can spike latency.

For Kubernetes, set the pod memory request/limit to `1.5–2× maxmemory`
and `maxmemory` ~70% of the limit. The OOM killer is more disruptive
than Redis's own eviction.

---

## 8.6 Big keys and hot keys

A **big key** is any single key holding tens of thousands of elements
or megabytes of data. Symptoms: high p99, long `DEL`, slow replication.

A **hot key** is a single key receiving a disproportionate share of
traffic. Symptoms: one shard saturated while others idle, in Cluster.

Detection:

- `redis-cli --bigkeys` for a sampling overview.
- `MEMORY USAGE <key>` for an exact measurement.
- `redis-cli --hotkeys` (requires `maxmemory-policy=allkeys-lfu` or
  `volatile-lfu`).
- Slowlog entries clustering on the same key.

Mitigations:

- **Bound collections**: `LTRIM` after `LPUSH`; cap ZSet size with a
  rolling window.
- **Shard the key**: `leaderboard:global:shard:N` (Chapter 07 §7.2),
  `counter:tenant:42:shard:N` for hot counters.
- **Cache in front of Redis**: an in-process LRU at the application
  layer absorbs hot reads. With server-assisted client-side caching
  (`CLIENT TRACKING`), invalidation is automatic.

Always replace `DEL` with `UNLINK` on potentially big keys: `UNLINK`
returns immediately and frees memory in a background thread.

---

## 8.7 Connection management

Each connection is cheap, but unbounded reconnection storms during a
failover can amplify the outage. Configure:

- **Reconnect strategy with backoff**: cap retries-per-second per
  client. `node-redis` v4 takes a function:

  ```ts
  createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (attempt) => Math.min(50 * 2 ** attempt, 2000),
      connectTimeout: 5_000,
    },
  });
  ```
- **Idle / max sockets**: in pooled clients (some `ioredis` configs),
  cap pool size proportional to expected concurrency, not unlimited.
- **`ready` gate**: gate health checks on the `ready` event, not just
  `connect`. The current
  `@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/product/src/redisClient.ts:1-28`
  does not — fix when introducing readiness probes.
- **Graceful shutdown**: on SIGTERM, call `client.quit()` (not
  `client.disconnect()`) so in-flight commands flush before the pod
  terminates.

For `Pub/Sub` and `BLPOP`/`XREAD BLOCK`, use a **separate connection** —
blocking commands hold the connection; mixing them with normal traffic
on a single connection serialises everything behind the blocker.

---

## 8.8 Pipelining and round-trips

Latency budgets in microservices are tight. A single 0.5 ms RTT looks
trivial; ten of them on a request path is 5 ms baseline before any
useful work.

Rules of thumb:

- Use `MGET` / `HMGET` over loops of `GET`.
- Use `multi()` / pipeline for fan-outs of independent commands.
- Use Lua scripts when commands depend on each other server-side.
- Profile with the slowlog (`SLOWLOG GET 20`) — anything > a few
  milliseconds is investigating.

---

## 8.9 Observability

Minimum metrics from each Redis instance, scraped by the platform's
observability stack:

| Source | Metric | Why |
|--------|--------|-----|
| `INFO server` | `uptime_in_seconds` | Restart detection |
| `INFO clients` | `connected_clients`, `blocked_clients` | Connection leaks, blocked-command growth |
| `INFO memory` | `used_memory`, `used_memory_rss`, `mem_fragmentation_ratio` | Memory pressure, fragmentation |
| `INFO stats` | `total_commands_processed`, `instantaneous_ops_per_sec`, `keyspace_hits`, `keyspace_misses`, `evicted_keys`, `expired_keys` | Throughput, hit rate, eviction pressure |
| `INFO replication` | `master_link_status`, `master_last_io_seconds_ago`, `master_repl_offset - slave_repl_offset` | Replication lag and link health |
| `INFO commandstats` | per-command latency and call count | Hot commands, bad patterns |
| `LATENCY HISTORY` | event-driven latency spikes | Forks, AOF rewrites, expirations |
| `SLOWLOG GET` | slow command bodies | Bad keys, full table scans |

Alert on:

- `evicted_keys` > 0 on instances expected to be TTL-bound.
- Replication lag > a few seconds.
- `mem_fragmentation_ratio` > 1.5 sustained (consider
  `activedefrag yes` if > 1.5 for hours).
- p99 latency on hot commands > 5 ms.

For application-level metrics, see the corresponding chapters
(cache hit rate in 02, lock outcomes in 04, rate-limit decisions in 05,
session lifecycle in 06).

The Prometheus exporter `oliver006/redis_exporter` covers the
instance-level metrics above out of the box.

---

## 8.10 Security

Redis assumes a trusted network. Defaults are inadequate for shared
clusters:

- **Bind to private network only.** Never expose 6379 publicly. In
  Kubernetes, use a `ClusterIP` Service and a NetworkPolicy restricting
  ingress to the application pods.
- **Require authentication.** Set `requirepass`, or better, configure
  ACLs (Redis 6+) with per-service users:

  ```
  ACL SETUSER product on >$strong_password ~product:* +@read +@write +@string +@hash +@scripting -DEBUG
  ```
- **TLS** for any traffic crossing trust boundaries (between availability
  zones, across VPCs). `redis-server` supports TLS natively
  (`tls-port`, `tls-cert-file`, etc.). Clients connect with
  `rediss://`.
- **Disable dangerous commands** in production with `rename-command`:

  ```
  rename-command FLUSHDB ""
  rename-command FLUSHALL ""
  rename-command CONFIG ""
  rename-command DEBUG ""
  rename-command KEYS ""
  ```

  Or use ACL `-FLUSHDB -FLUSHALL -CONFIG -DEBUG -KEYS` per user.
- **Secrets in environment variables / mounted files**, not in the
  connection URL committed to manifests.

Auditing: `MONITOR` shows every command but slows the server
substantially — use only briefly during investigation, never as a
persistent stream.

---

## 8.11 Backups

For instances with persistence:

- Take RDB snapshots from a **replica**, not the primary, to avoid
  fork pauses on the request path.
- Store snapshots in object storage (S3 / GCS) with a lifecycle policy.
- Test restore at least quarterly; a backup you have not restored is a
  hope, not a backup.

For ephemeral cache instances, no backup is needed — the application
must handle the empty-cache case anyway.

---

## 8.12 Incident runbook

Symptoms and first responses:

| Symptom | Likely cause | First action |
|---------|--------------|--------------|
| p99 latency spike, ops/sec normal | Slow command | `SLOWLOG GET 20`, kill the offender |
| p99 latency spike with low ops/sec | Fork / AOF rewrite | `LATENCY HISTORY`; consider deferring rewrite |
| Memory at `maxmemory`, evictions rising | Workload growth, big keys | `--bigkeys`; bound collections; resize |
| Many `connected_clients`, climbing | Connection leak | Restart leaking app; fix lifecycle |
| Replication lag > seconds | Network or primary CPU saturation | Check replica disk I/O if AOF; check network |
| Sentinel failover loop | `down-after-milliseconds` too low, or genuine instability | Check primary host; raise threshold temporarily |
| `OOM command not allowed` | `maxmemory` reached + `noeviction` | Resize, or change policy if data is dispensable |
| Cache hit rate collapsed | Mass eviction or schema/version change | Check `evicted_keys`; check application logs for redeploy |

Always have:

- A *named* runbook entry per workload class with on-call contacts.
- A documented dataset rebuild path for caches (how long, what cost).
- A documented session loss recovery path (force re-login UX).

---

## 8.13 Pre-production checklist

Before declaring a Redis-using service production-ready:

- [ ] Topology chosen (single / Sentinel / Cluster) and documented.
- [ ] `maxmemory` and `maxmemory-policy` set explicitly.
- [ ] Persistence configuration matches workload class (§8.2).
- [ ] Reconnect strategy with bounded backoff in client.
- [ ] Graceful shutdown wired to SIGTERM.
- [ ] `ready` event gates the readiness probe.
- [ ] Slowlog and `INFO`-based metrics scraped.
- [ ] Alerts on eviction, replication lag, memory, p99 latency.
- [ ] ACL or `requirepass` set; network policy restricts ingress.
- [ ] TLS where the connection crosses trust boundaries.
- [ ] Dangerous commands disabled or ACL-restricted.
- [ ] Backup / restore tested for persistent instances.
- [ ] Runbook entry committed to repo.
- [ ] Application code paths handle Redis unavailability deterministically (fail-open or fail-closed, not undefined).

---

## 8.14 References

- Redis admin guide: <https://redis.io/docs/latest/operate/oss_and_stack/management/>
- Persistence: <https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/>
- Sentinel: <https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/>
- Cluster spec: <https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/>
- Latency monitoring: <https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency-monitor/>
- ACL: <https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/>

End of reference. The accompanying examples under
`@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/sandbox/redis-learning/examples`
implement the patterns in this reference at minimum-viable depth; treat
them as a starting point, not a template.
