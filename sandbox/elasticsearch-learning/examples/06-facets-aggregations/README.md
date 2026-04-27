# 06 — Facets & Aggregations

Search "shoes" with brand + price-range facets. Then apply a `post_filter`
to narrow the hit list to one brand and watch the brand facet **stay
populated** — that's the dead-end-prevention pattern.

## Run

```bash
npm run facets
```

## What to notice

- Brand facet still shows other brands after `post_filter` is applied.
- If we had moved the brand filter into `bool.filter`, the brand facet
  would collapse to one bucket — the user could not click another brand.
- Aggregations run regardless of `from/size`; they reflect the whole
  matched set.
