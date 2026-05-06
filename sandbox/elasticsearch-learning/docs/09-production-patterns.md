# 09 — Production Patterns

## What problem does this solve?

You can run ES locally in 10 minutes. Running it in production for years
is a different job. This chapter covers the operational concerns that
turn a working sandbox into a reliable service: sizing, shards,
snapshots, security, observability, upgrades, and the "should I run my
own?" decision.

## The minimal mental model

### 1. Should you run your own cluster?

Tally up the operational work:

- Provisioning, scaling, network, storage.
- JVM tuning and GC monitoring.
- Snapshots and restore drills.
- Version upgrades (rolling).
- Security: TLS, role-based access, secret rotation.
- Capacity planning and shard rebalancing.

A managed offering (Elastic Cloud, AWS OpenSearch, Bonsai) eats most of
this for money. Defaults below assume self-hosted on Kubernetes (the
existing platform), but **the answer is "use managed" unless you have a
clear reason**.

### 2. Sizing — the first numbers you need

A sane default for getting started:

| Resource | Starting point | Tune by |
|----------|----------------|---------|
| **Heap** | 50% of node RAM, **never more than ~30 GB** | Watching GC pauses |
| **OS file cache** | The other 50% (Lucene mmap relies on it) | Don't undersize the host |
| **Disk** | NVMe / SSD, 50% headroom for merges | Watching disk I/O |
| **CPU** | 2-8 cores per node | Watching search latency p95 |

The 30 GB heap cap is real — above it, JVM gives up compressed
ordinary-object pointers (CompressedOops) and you waste memory. Run more
nodes, not bigger heaps.

### 3. Shards — the most-misunderstood number

Two rules of thumb that will keep you out of trouble:

1. **Aim for shard size 10–50 GB**, not "a shard per record type".
2. **Total shards across the cluster**: roughly 20 shards per GB of
   heap, ceiling. Past that, the cluster state and cluster-manager work
   become the bottleneck.

Translation: a 10 GB index with 5 primaries is **over-sharded**. One
primary is fine.

You pick `number_of_shards` once (creation time). To change it: reindex
into a new index (chapter 08). You can change `number_of_replicas` any
time.

For a typical product catalogue (a few million docs, a few GB), **1
primary + 1 replica** is the right answer.

### 4. Cluster topology

Smallest production-meaningful setup:

```
3 dedicated master nodes (small, no data)
N data nodes (size for your indices)
2+ coordinating/ingest nodes (optional, behind the load balancer)
```

Why 3 masters: leader election needs a majority. With 1 master, single
point of failure. With 2, split-brain risk. With 3, you tolerate one
failure.

For a small platform you can collapse master + data into the same nodes
(`node.roles: ["master", "data"]`) — works, but be aware that data-node
GC pauses can stall the master role.

### 5. Snapshots — the only backup that exists

ES has its own backup: the **snapshot/restore** API, writing to a
**snapshot repository** (S3, GCS, Azure Blob, shared filesystem).
Snapshots are incremental.

Minimal recipe:

```json
PUT /_snapshot/main_repo
{
  "type": "s3",
  "settings": { "bucket": "ecom-es-snapshots", "region": "ap-south-1" }
}

PUT /_snapshot/main_repo/snap-2026-04-25?wait_for_completion=false
{ "indices": "products,users", "ignore_unavailable": true }
```

Use **SLM** (snapshot lifecycle management) for automation: create a
policy with a schedule and retention, ES handles it.

**Restore drill once a quarter.** A snapshot you have never restored is
not a backup.

### 6. Security — the parts that matter

In ES 8, security is on by default:

- **TLS** between nodes and from clients. Use real certs, not self-signed,
  in prod.
- **Authentication**: username+password is fine; **API keys** are better
  for services (revocable, scoped).
- **Authorization**: built-in role system. Each service gets a role with
  the minimum needed indices/actions. The `product` service probably
  needs `read,write,create_index` on `products*`, nothing else.
- **Network**: don't expose ES to the public internet, ever. Same VPC
  as the services that use it. The k8s manifest at
  `@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/k8s/elasticsearch-depl.yml` already runs as a `ClusterIP` Service — keep it that way.

### 7. Observability — the four metrics you must watch

| Metric | What it tells you | Alert when |
|--------|-------------------|------------|
| **Cluster health** | red = lost primary, yellow = lost replica, green = healthy | red for any duration; yellow for >X min |
| **Heap used %** | GC pressure | sustained >75% |
| **Search latency p95/p99** | Is search staying fast? | breaches your SLO |
| **Indexing rate vs. queue size** | Is the bulk queue draining? | queue rising for >5 min |

Plus: disk usage. ES goes read-only at 95% disk by default
(`cluster.routing.allocation.disk.watermark.high`). Alert at 80%.

Logs: ES emits structured JSON logs (slow log, deprecation log,
GC log). Slow log thresholds are per-index settings:

```json
PUT /products/_settings
{
  "index.search.slowlog.threshold.query.warn": "500ms",
  "index.indexing.slowlog.threshold.index.warn": "1s"
}
```

The platform's Kibana (`kibana.yml`) is the sane place to keep
dashboards.

### 8. Upgrades — rolling, version by version

ES supports rolling upgrades within a major version (8.x → 8.y) and
**one major hop** (e.g. 7.last → 8.x). Do not skip majors.

Rolling upgrade flow:

1. Disable shard allocation.
2. Stop one node, upgrade it, start it back, wait for it to rejoin.
3. Re-enable allocation, wait for green.
4. Repeat per node.

The Elastic docs have the canonical playbook; on Kubernetes, the
Elasticsearch Operator (`ECK`) automates it.

### 9. Capacity tripwires

Watch these numbers; they catch most "ES is acting weird" before users do:

- **Pending tasks** (`/_cluster/pending_tasks`): should be 0–small. Big
  number = master is overloaded.
- **Thread pool rejections**: any rejection in the search or bulk pool
  means you are over capacity for that workload.
- **Field data + query cache size**: too big → memory pressure. Reduce
  with smaller `terms` aggs or `filter` context.
- **Segments per shard**: thousands of tiny segments hurts performance.
  ES merges in the background; if it can't keep up, indexing is too
  hot.

## Concrete example — production index template

Don't create indices ad-hoc in production. Use **index templates** so
new indices automatically get the right settings:

```json
PUT /_index_template/products_template
{
  "index_patterns": ["products-*"],
  "priority": 100,
  "template": {
    "settings": {
      "number_of_shards":   1,
      "number_of_replicas": 1,
      "refresh_interval":   "1s",
      "analysis": { /* ... */ }
    },
    "mappings": { /* ... */ },
    "aliases": {
      "products": {}
    }
  }
}
```

Now `PUT /products-2026-04` automatically becomes part of the
`products` alias with the right settings. This is also the foundation
for time-based indices (chapter 08, alias swap).

## Trade-offs / when this breaks

- **Default shard count of 1 (ES 7+) is correct for small indices.** ES
  used to default to 5; people copy old configs. Be explicit.
- **A single data node** is "production" for a sandbox; for real
  workloads you want at least 3 data nodes for replica placement.
- **Snapshots to local disk** are not snapshots. The host going away
  takes them too. Use S3/GCS/Azure.
- **Running search and indexing on the same hot nodes** can starve
  search latency during big bulk loads. The standard fix is dedicated
  ingest/coordinating nodes; the simpler fix is to throttle the bulk
  load (`flushBytes`, `concurrency`).
- **No client-side timeouts.** A slow ES query holds an HTTP server
  worker. Always set a timeout in the client (e.g. 2-5s for search).

## What to remember

- Use a managed cluster unless you have a strong reason not to.
- Heap ≤ 30 GB, leave half RAM for OS file cache.
- Aim for 10–50 GB shards. Most platforms over-shard.
- Always: 3 master-eligible nodes, snapshots to object storage, TLS,
  per-service API keys.
- Watch cluster health, heap, search latency, queue size, disk.
- Use index templates and aliases. Never bake concrete index names into
  client code.
- A snapshot you have never restored is not a backup.
