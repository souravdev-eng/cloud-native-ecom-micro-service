# Elasticsearch Learning Sandbox

A plain-language reference for designing and running search with Elasticsearch
inside this microservices platform. The goal is to build the mental model first
(**what is an inverted index, and why does it change everything?**) and only
then dive into the JSON of Query DSL.

This is a **sandbox**. It does not change any service yet. The motivating
target — replacing the Mongo text-index search in `product/` with Elasticsearch
— is documented but left as a follow-up.

---

## Scope

The reference is organised into ten chapters:

| #  | Chapter | Focus (in plain words) |
|----|---------|-----------------------|
| 00 | [Index](./docs/00-index.md) | Map of chapters, glossary, how to read |
| 01 | [Fundamentals](./docs/01-elasticsearch-fundamentals.md) | What ES is, inverted index intuition, when *not* to use it |
| 02 | [Mappings & analyzers](./docs/02-mappings-and-analyzers.md) | Field types, `text` vs `keyword`, custom analyzers |
| 03 | [Query DSL basics](./docs/03-query-dsl-basics.md) | `match`, `term`, `bool`, filter vs query context, pagination |
| 04 | [Full-text & multi-match](./docs/04-full-text-and-multi-match.md) | Searching across multiple fields, boosts, fuzziness |
| 05 | [Autocomplete](./docs/05-autocomplete-and-suggesters.md) | Edge n-grams vs `search_as_you_type` vs `completion` |
| 06 | [Aggregations & facets](./docs/06-aggregations-and-facets.md) | Faceted search: category + price + brand counts |
| 07 | [Relevance tuning](./docs/07-relevance-tuning.md) | BM25 intuition, boosts, recency decay, evaluating relevance |
| 08 | [Indexing & sync](./docs/08-indexing-and-sync.md) | Bulk API, aliases for zero-downtime reindex, syncing from Mongo |
| 09 | [Production patterns](./docs/09-production-patterns.md) | Sizing, shards, snapshots, security, observability |

---

## Stack assumptions

- **Engine**: Elasticsearch `8.x` (single-node for the sandbox; the platform
  runs ES in Kubernetes — see `@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/k8s/elasticsearch-depl.yml`).
- **Client**: official `@elastic/elasticsearch` `^8.14`.
- **Language**: TypeScript, ES2020 target. `tsx` for running examples.
- **Kibana**: included in the sandbox compose for poking around (`http://localhost:5601`).

OpenSearch is API-compatible with ES `7.x` for most things in this reference,
but **not** all (notably `search_as_you_type` and some 8.x features). Where it
matters, the chapter calls it out.

---

## How to run the examples

```bash
# 1. Start Elasticsearch + Kibana for the sandbox
cd sandbox/elasticsearch-learning
docker compose up -d

# 2. Wait until ES is green
curl -s http://localhost:9200/_cluster/health | jq .status
# expect: "green" or "yellow" (single-node has no replicas → yellow is fine)

# 3. Install and run an example
cd examples
npm install
npm run basic-crud
```

Every example is self-contained: it creates the index it needs, indexes a few
documents, runs queries, prints results, and (usually) deletes the index at
the end so the next example starts clean.

---

## How this maps to the platform

Today, product search lives in `product/` and uses a MongoDB text index:

- `@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/product/src/migrations/2026-04-25-product-text-index.ts` — text index migration.
- `@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/product/src/utils/productApiFeature.ts` — search/filter/sort/paginate helper.
- `@/Users/sauravmajumdar/Developer/project/micro-service/cloud-native-ecom-micro-service/product/src/routes/showProduct.ts` — search route.

That works for small catalogues but does not scale to autocomplete, faceted
filters with counts, fuzzy matching, or relevance tuning. Chapter 08 sketches
the migration; chapter 09 covers the operational concerns. **No code in
`product/` is modified by this sandbox.**

---

## Reading order

If you are new to Elasticsearch, read **01 → 09 in order**. If you are looking
up a specific decision:

- **"How do I avoid `text` vs `keyword` confusion?"** — Chapter 02.
- **"Why does my filter return 0 hits when I expect some?"** — Chapter 02 (analyzers) + 03 (filter context).
- **"Which autocomplete approach should I pick?"** — Chapter 05 (decision table).
- **"How do I add facets without breaking the result list?"** — Chapter 06 (`post_filter`).
- **"How do I reindex without downtime?"** — Chapter 08 (alias swap).
- **"Should I run my own ES cluster?"** — Chapter 09.

---

## External references

The chapters cite primary sources. The following are worth reading once:

- Elasticsearch Guide (8.x): <https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html>
- *Relevant Search* — Doug Turnbull & John Berryman (best applied book on relevance).
- BM25 explained: <https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables>
- "Zero-downtime reindexing": <https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-reindex.html>
