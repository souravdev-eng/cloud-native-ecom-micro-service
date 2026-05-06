# 03 — Query DSL Basics

## What problem does this solve?

You need to express:

> "Find products where the title or description contains the user's words,
> AND the category is `shoes`, AND the price is between 50 and 200, sorted
> by relevance, page 3 of 20-per-page."

The Elasticsearch Query DSL is the JSON language for that. It looks
intimidating at first because it nests, but really there are only ~6 query
types you need 95% of the time.

## The minimal mental model

### 1. The shape of every search

```json
POST /products/_search
{
  "from": 0,
  "size": 20,
  "query":  { ... },
  "sort":   [ ... ],
  "_source": [ "title", "price", "brand" ]
}
```

- `query` — what to match.
- `from / size` — pagination.
- `sort` — order. Default is `_score` desc.
- `_source` — which fields to return (skip the rest, save bandwidth).

### 2. The five queries you need

#### `match` — full-text, analyzed

The default for searching `text` fields. ES runs the user's input through
the same analyzer as the field, then looks up each token.

```json
{ "query": { "match": { "title": "red running shoes" } } }
```

Default `operator` is `or`: matches docs containing **any** of the tokens.
Use `"operator": "and"` to require all.

#### `term` — exact, NOT analyzed

For `keyword` fields. Matches exactly.

```json
{ "query": { "term": { "brand": "Acme" } } }
```

Common bug: using `term` on a `text` field. ES indexed `"Red Running
Shoes"` as `["red", "running", "shoes"]`, so `term: "Red Running Shoes"`
finds nothing. Use `match`, or query the `.keyword` multi-field.

#### `terms` — exact, multiple values (OR)

```json
{ "query": { "terms": { "brand": ["Acme", "Globex"] } } }
```

#### `range` — numbers and dates

```json
{ "query": { "range": { "price": { "gte": 50, "lte": 200 } } } }
{ "query": { "range": { "createdAt": { "gte": "now-7d/d" } } } }
```

#### `bool` — combine the above

This is the workhorse. Four clauses:

| Clause | Effect on results | Effect on score |
|--------|-------------------|-----------------|
| `must` | required | yes — adds to score |
| `should` | optional (any of these is a bonus) | yes |
| `filter` | required | **no** — not scored, cacheable |
| `must_not` | excluded | no |

```json
{
  "query": {
    "bool": {
      "must":   [ { "match": { "title": "running shoes" } } ],
      "filter": [
        { "term":  { "category": "shoes" } },
        { "range": { "price": { "gte": 50, "lte": 200 } } }
      ],
      "should": [ { "term": { "brand": "Acme" } } ],
      "must_not": [ { "term": { "discontinued": true } } ]
    }
  }
}
```

Reads as: "must contain running shoes in title, must be in shoes category
and 50-200 in price, prefer Acme, exclude discontinued."

### 3. Filter context vs query context — why it matters

Two things happen in **filter context**:

1. **No score is computed** — saves CPU.
2. **Result is cached** — next request with the same filter is faster.

Things that should be filters, not queries:

- Category, brand, status, "in stock", date ranges, IDs.

Things that should be queries:

- The user's typed search words.

Practical rule: **if the user's intent is "narrow to this set", it's a
filter. If it's "rank by how well this matches", it's a query.**

### 4. Pagination — `from/size` vs `search_after`

`from/size` is fine for the first ~10000 results. ES has a hard cap
(`index.max_result_window`, default 10000) because deep pagination has to
sort `from + size` results in memory across all shards.

For "infinite scroll" or deep pages, use `search_after`:

```json
// page 1
{ "size": 20, "sort": [ "_score", { "id": "asc" } ] }

// response includes the last hit's sort values:
// "sort": [ 4.2, "p_4321" ]

// page 2 — pass them in
{
  "size": 20,
  "sort": [ "_score", { "id": "asc" } ],
  "search_after": [ 4.2, "p_4321" ]
}
```

Notes:

- `search_after` is stateless — no scroll/cursor on the server.
- The sort must be **deterministic**. Add a tie-breaker (like `id`) so
  ties don't shift between pages.
- You cannot jump to page 50 directly. That is usually fine; users do not
  do that anyway.

### 5. Sort — and the `text`-field gotcha

```json
{ "sort": [ { "price": "asc" }, "_score" ] }
```

You **cannot** sort on a `text` field. Use the `.keyword` multi-field:

```json
{ "sort": [ { "title.keyword": "asc" } ] }
```

`_score` is the implicit default sort.

### 6. `_source` filtering

By default ES returns the whole stored document. You usually don't need it.

```json
{ "_source": ["title", "price", "brand"] }
```

Saves bandwidth and JSON parsing time on the client. For a search-results
page you typically need just title, image URL, price, ID.

## Concrete example — the "search + filter" pattern

```json
POST /products/_search
{
  "from": 0,
  "size": 20,
  "_source": ["title", "price", "brand", "category"],
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "running shoes",
            "fields": ["title^3", "description"]
          }
        }
      ],
      "filter": [
        { "term":  { "category": "shoes" } },
        { "range": { "price":    { "gte": 50, "lte": 200 } } }
      ]
    }
  },
  "sort": ["_score", { "createdAt": "desc" }]
}
```

What this does in plain words:

- The user typed `"running shoes"`. Match it against the title (3x boost)
  and description.
- Narrow to category `shoes` and price 50-200. These do not affect score.
- Return 20 results sorted by score, then by recency as a tie-breaker.

## Trade-offs / when this breaks

- **`should` without `must`** changes meaning: at least one `should` clause
  becomes required by default. Set `minimum_should_match: 0` if you only
  want a score bonus.
- **Mixing `must` and `filter` for the same condition** is wasteful. If
  it's not affecting score, put it in `filter`.
- **`from + size > 10000`** errors out. Use `search_after`.
- **`match` on a `keyword` field** still works, but only as exact match.
  No analysis on the field side. Usually a sign of a wrong field type
  decision.

## What to remember

- `match` for `text`, `term`/`terms` for `keyword`. Don't cross the streams.
- `bool.filter` for "narrow to this set"; `bool.must` for "rank these".
- Filter context is faster and cacheable.
- Use `search_after` for deep pagination.
- Sort/agg use `.keyword`, not `text`.
- Always set `_source` to only the fields you need.
