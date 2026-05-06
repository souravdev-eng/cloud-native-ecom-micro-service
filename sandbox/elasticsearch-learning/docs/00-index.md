# 00 — Index

A one-page map of this reference. Read top to bottom on first pass; jump
around once you know which chapter owns which decision.

---

## Chapters

1. **[Fundamentals](./01-elasticsearch-fundamentals.md)** — what ES is, the
   inverted index in plain words, cluster/node/shard/replica, when not to use it.
2. **[Mappings & analyzers](./02-mappings-and-analyzers.md)** — `text` vs
   `keyword`, dynamic vs explicit mapping, custom analyzers (lowercase,
   ascii-folding, stop), why mappings are mostly immutable.
3. **[Query DSL basics](./03-query-dsl-basics.md)** — `match`, `term`, `bool`,
   filter vs query context, pagination (`from/size` vs `search_after`), sort.
4. **[Full-text & multi-match](./04-full-text-and-multi-match.md)** — searching
   across multiple fields with boosts and fuzziness; the four `multi_match`
   modes you actually need.
5. **[Autocomplete](./05-autocomplete-and-suggesters.md)** — edge n-grams vs
   `search_as_you_type` vs `completion`. A decision table, not a survey.
6. **[Aggregations & facets](./06-aggregations-and-facets.md)** — counts,
   ranges, nested filters, the `post_filter` pattern for faceted UIs.
7. **[Relevance tuning](./07-relevance-tuning.md)** — BM25 in one paragraph,
   boosts, `function_score`, recency decay, evaluating relevance with judged
   queries.
8. **[Indexing & sync](./08-indexing-and-sync.md)** — bulk API, refresh,
   aliases for zero-downtime reindex, syncing from MongoDB without dual-write
   pain.
9. **[Production patterns](./09-production-patterns.md)** — sizing, shards,
   snapshots, security, observability, upgrade path.

---

## Glossary (the words that trip people up)

| Word | Plain meaning |
|------|---------------|
| **Document** | One JSON object you index. Like a row, but it can be nested. |
| **Index** | A named collection of documents (like a table). Confusing because **also** a verb (to index = to write). |
| **Shard** | A slice of an index. Each shard is a self-contained Lucene index. |
| **Replica** | A copy of a shard for redundancy and read scale. |
| **Mapping** | The schema. Field names → field types and analyzers. |
| **Analyzer** | A pipeline that turns a string into a list of tokens (the searchable units). |
| **Token** | One unit produced by an analyzer (e.g. `"running"` → `["run"]` after stemming). |
| **`text` field** | Analyzed. Good for full-text search. **Cannot** be sorted or aggregated reliably. |
| **`keyword` field** | Not analyzed (kept whole). Good for filters, sorts, aggregations, exact match. |
| **Query context** | Scored. Affects relevance. |
| **Filter context** | Yes/no. No score. Cacheable. Faster. |
| **Inverted index** | Term → list of documents that contain it. The reason ES is fast. |
| **Refresh** | Make recent writes visible to search. Default every 1s, not on write. |
| **Alias** | A pointer to one or more indices. Lets you swap indices without changing client code. |

---

## How to read this

Each chapter is structured the same way:

1. **What problem does this solve?** — one paragraph.
2. **The minimal mental model** — concepts, not syntax.
3. **Concrete example** — JSON or TS, runnable.
4. **Trade-offs / when this breaks** — what you will learn the hard way.
5. **What to remember** — bullet list at the end.

If you only have ten minutes per chapter, read sections 1, 2, and 5.
