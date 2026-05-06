# 01 — Elasticsearch Fundamentals

## What problem does this solve?

You have a million products. A user types `"red runing shoe"`. They want
`"Red Running Shoes"` to come back, ranked above `"Shoe Polish (Red)"`, in
under 50ms, while another user is filtering by brand and another is loading
the next page.

A `LIKE '%runing%'` query in your relational database does not do this. Even
a Mongo text index struggles past a few million docs once you add facets,
typo tolerance, and relevance tuning.

Elasticsearch is built for exactly this shape of problem: **fast, ranked
search over text, with filters and aggregations on top.**

## The minimal mental model

### 1. The inverted index — why ES is fast

Imagine three documents:

```
doc 1: "red running shoes"
doc 2: "blue running socks"
doc 3: "red leather wallet"
```

A normal database stores it row-by-row. To find documents containing
`"running"`, it has to scan every row.

An **inverted index** flips it around. It builds a dictionary from words to
the documents that contain them:

```
red     → [1, 3]
running → [1, 2]
shoes   → [1]
blue    → [2]
socks   → [2]
leather → [3]
wallet  → [3]
```

Now searching for `"running"` is a hash lookup — no scan. Searching for
`"red running"` is two lookups + an intersection: `[1,3] ∩ [1,2] = [1]`.

This is the single most important idea in ES. Everything else (analyzers,
queries, relevance) is decoration on top of the inverted index.

### 2. Documents and indices

- A **document** is a JSON object. There is no `id` column requirement; ES
  generates one if you do not.
- An **index** (the noun) is a named collection of documents.
- "To index a document" (the verb) means "write it into an index".

```jsonc
// document
{ "id": "p_42", "title": "Red Running Shoes", "price": 89.99, "brand": "Acme" }

// indexed into an index named "products"
PUT /products/_doc/p_42
{ ... }
```

### 3. Cluster, node, shard, replica

Stop here for one minute and read this carefully — these four words get
mixed up constantly.

- **Cluster** — one or more nodes that share data. Has a name.
- **Node** — one running ES process (one JVM, one container).
- **Shard** — a slice of an index. Each shard is itself a complete Lucene
  index. An index with 3 shards is split across 3 shards; a query hits all
  three in parallel.
- **Replica** — a copy of a shard. Lives on a different node. Used for
  redundancy and to serve read traffic.

```
products index, 3 primary shards, 1 replica each:

  node-1: P0   R1
  node-2: P1   R2
  node-3: P2   R0

P = primary, R = replica. ES never puts a primary and its replica on the
same node.
```

You pick the number of primary shards **at index creation time**. You can
change replicas later, but to change primaries you reindex (chapter 08).
The most common mistake is over-sharding: 50 shards for 100MB of data.
Rule of thumb in chapter 09.

### 4. Near-real-time, not real-time

When you write a document, it is **not immediately searchable**. ES buffers
writes and "refreshes" them into a searchable segment every 1 second by
default. This is what people mean by "near-real-time".

Two consequences you will hit:

1. In tests, after you index, call `refresh: true` or `await
   client.indices.refresh()` before you search, or you will get empty
   results and assume your code is broken.
2. In production, do **not** set `refresh: true` on every write — it
   destroys throughput. Bulk-write, then refresh once. Chapter 08.

### 5. Score, not just match

A SQL `WHERE` returns rows. An ES query returns rows **with a score**
(`_score`). The default scoring algorithm is BM25 (chapter 07). The score
is what makes search feel like search instead of a filter.

You can also run queries in **filter context** to skip scoring (faster,
cacheable). Chapter 03.

## Concrete example

```bash
# create an index
curl -XPUT localhost:9200/products

# index two documents
curl -XPOST localhost:9200/products/_doc/1 -H 'content-type: application/json' -d '
{ "title": "Red Running Shoes", "price": 89.99, "brand": "Acme" }'

curl -XPOST localhost:9200/products/_doc/2 -H 'content-type: application/json' -d '
{ "title": "Shoe Polish (Red)", "price": 4.50, "brand": "Generic" }'

# refresh so they are searchable
curl -XPOST localhost:9200/products/_refresh

# search — note the scores
curl localhost:9200/products/_search?q=running+shoes&pretty
```

Document 1 will score higher than document 2 because both query terms hit
the same document.

## Trade-offs / when *not* to use Elasticsearch

ES is a search engine first. Treat it as a primary database **only if you
can tolerate**:

- **Eventual consistency** — refresh is async, replication is async. There
  is no `SELECT ... FOR UPDATE`.
- **No real transactions** — single-document operations are atomic; that is
  it. No multi-doc commit/rollback.
- **No joins** — there is parent/child and nested, but they are not free
  and they are not SQL joins.
- **Schema rigidity** — once a field is mapped as `text`, you cannot change
  it to `keyword` without reindexing.
- **Operational cost** — JVM tuning, shard sizing, snapshots, version
  upgrades. A managed service (Elastic Cloud, AWS OpenSearch) eats most of
  this for money.

A safe default: **MongoDB or Postgres is the source of truth. Elasticsearch
is a read-only projection of search-relevant fields.** Chapter 08.

## What to remember

- ES is fast because of the **inverted index**, not because it is in-memory.
- A **shard** is a complete Lucene index. Pick shard count at index creation.
- Writes are visible after **refresh** (1s default), not immediately.
- Queries return a **score**; filters do not.
- ES is not a transactional database. Keep your source of truth elsewhere.
