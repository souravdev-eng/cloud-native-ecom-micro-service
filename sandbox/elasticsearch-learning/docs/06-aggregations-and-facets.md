# 06 — Aggregations & Facets

## What problem does this solve?

A product results page usually shows two things side by side:

- **Results** — the list of products matching the query.
- **Facets** — counts next to each filter option:
  - Category: Shoes (124), Bags (37), …
  - Brand: Acme (51), Globex (29), …
  - Price: 0–50 (12), 50–100 (88), 100–200 (42), 200+ (19)

Facets are computed by **aggregations**. They run on the same query and
return alongside the hits. The trick is making them behave correctly when
filters are applied — that's what `post_filter` is for.

## The minimal mental model

### 1. Two families of aggregations

- **Bucket aggs** — group documents into buckets. Like `GROUP BY` in SQL.
  Examples: `terms` (group by category), `range` (group by price bucket),
  `date_histogram` (group by day).
- **Metric aggs** — compute a number over docs. Examples: `avg`, `sum`,
  `min`, `max`, `cardinality` (distinct count).

You **nest** metric aggs inside bucket aggs to get "average price per
brand", etc.

### 2. The shape of a search-with-facets

```json
POST /products/_search
{
  "size": 20,
  "query": { "match": { "title": "shoes" } },
  "aggs": {
    "by_brand": {
      "terms": { "field": "brand", "size": 10 }
    },
    "by_category": {
      "terms": { "field": "category", "size": 20 }
    },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 50 },
          { "from": 50, "to": 100 },
          { "from": 100, "to": 200 },
          { "from": 200 }
        ]
      }
    },
    "avg_price": { "avg": { "field": "price" } }
  }
}
```

Response shape:

```json
{
  "hits":  { "total": ..., "hits": [...] },
  "aggregations": {
    "by_brand":     { "buckets": [ { "key": "Acme", "doc_count": 51 }, ... ] },
    "by_category":  { "buckets": [ ... ] },
    "price_ranges": { "buckets": [ ... ] },
    "avg_price":    { "value": 89.34 }
  }
}
```

### 3. Aggregations need `keyword` (or numeric)

A `terms` agg on a `text` field is either an error or requires `fielddata:
true` (memory hog). Always agg on `keyword`:

```jsonc
{ "field": "brand" }              // works if brand is keyword
{ "field": "title.keyword" }      // works on the multi-field
{ "field": "title" }              // error or memory bomb
```

### 4. The faceted-search trap — and `post_filter`

Naive approach: when the user picks "Brand: Acme", you add it to the
query. Now the result list narrows AND the brand facet collapses to
just `Acme: 51` — the user can never pick another brand.

Fix: **don't filter at query time; filter after the aggs run.** That's
`post_filter`.

```json
POST /products/_search
{
  "size": 20,
  "query": { "match": { "title": "shoes" } },
  "post_filter": {
    "term": { "brand": "Acme" }
  },
  "aggs": {
    "by_brand":     { "terms": { "field": "brand" } },
    "by_category":  { "terms": { "field": "category" } }
  }
}
```

What happens:

- `query` runs → finds all shoe docs.
- Aggs compute over that set → brand and category facets show all
  options.
- `post_filter` narrows the **hits only** → results show just Acme.

The user sees: "Acme (51)" highlighted, and other brand options still
clickable.

### 5. Multiple selections — facets that don't kill themselves

When the user picks **multiple** filters (e.g. brand: Acme + category:
shoes), you usually want each facet to ignore **its own** filter but
respect the others. Otherwise the brand facet drops to "Acme only"
once the user picks Acme.

The clean version uses **filtered aggregations**:

```json
POST /products/_search
{
  "size": 20,
  "query": {
    "bool": {
      "must":   [ { "match": { "title": "shoes" } } ],
      "filter": [
        { "term": { "category": "shoes" } }
        // notice: brand is NOT here
      ]
    }
  },
  "post_filter": { "term": { "brand": "Acme" } },
  "aggs": {
    "by_brand": {
      "filter": { "term": { "category": "shoes" } },
      "aggs": {
        "values": { "terms": { "field": "brand" } }
      }
    },
    "by_category": {
      "filter": { "term": { "brand": "Acme" } },
      "aggs": {
        "values": { "terms": { "field": "category" } }
      }
    }
  }
}
```

Reads as:

- The list of hits respects all filters (via `bool.filter` + `post_filter`).
- The brand facet ignores the brand filter, so "Globex" still shows up
  with its real count.
- The category facet ignores the category filter (here trivially the
  same).

This is the "drilldown without dead ends" pattern. Most ecom search
frontends use exactly this.

### 6. Cardinality — distinct counts

```json
{ "aggs": { "unique_brands": { "cardinality": { "field": "brand" } } } }
```

`cardinality` is **approximate** (HyperLogLog++). Default precision is
3000 — accurate enough for "X distinct brands" displays. Bumping
precision costs memory.

If you absolutely need exact counts, you have to materialise the list and
count. Usually approximate is fine for UI counters.

### 7. Date histograms — for time-series-ish dashboards

```json
{
  "aggs": {
    "sales_per_day": {
      "date_histogram": {
        "field": "createdAt",
        "calendar_interval": "day"
      },
      "aggs": {
        "total_revenue": { "sum": { "field": "price" } }
      }
    }
  }
}
```

`calendar_interval` (`day`, `week`, `month`) handles DST and month length;
`fixed_interval` (e.g. `24h`) doesn't. Pick the one that matches your
intent.

## Concrete example — "shoes" with filters and facets

Search for "shoes", filter by `category: shoes`, the user has selected
brand `Acme` from the facet panel:

```json
POST /products/_search
{
  "size": 20,
  "_source": ["title", "brand", "price"],
  "query": {
    "bool": {
      "must": [
        { "multi_match": { "query": "shoes", "fields": ["title^3", "description"] } }
      ],
      "filter": [
        { "term": { "category": "shoes" } }
      ]
    }
  },
  "post_filter": { "term": { "brand": "Acme" } },
  "aggs": {
    "brands":       { "terms": { "field": "brand", "size": 20 } },
    "price_ranges": { "range": {
      "field": "price",
      "ranges": [ { "to": 50 }, { "from": 50, "to": 100 }, { "from": 100, "to": 200 }, { "from": 200 } ]
    } }
  }
}
```

Result: 20 Acme shoes + brand counts for all brands matching "shoes" +
price-range counts within all "shoes" matches.

## Trade-offs / when this breaks

- **`terms` size matters.** Default 10 buckets. Increase explicitly when
  you display more (e.g. `size: 50`). The shard-level numbers can be
  approximate; for high-cardinality fields, set
  `"shard_size": <2-3x size>` for accuracy.
- **High-cardinality `terms` aggs are expensive.** Don't agg on free-text
  user content (e.g. `keyword`-mapped descriptions).
- **`post_filter` runs once at the end.** It does not affect aggs; that
  is the point, but make sure that's actually what you want.
- **Aggs ignore `from/size`.** They run over the full hit set, not just
  the page.

## What to remember

- Aggs are how you build facets. `terms`, `range`, `date_histogram` cover
  most needs.
- Always agg on `keyword` (or numeric/date), never on `text`.
- Use `post_filter` so the user can change facet selections without dead
  ends.
- For multi-select facets, scope **filtered aggs** so each facet ignores
  its own filter.
- `cardinality` is approximate. Usually fine.
