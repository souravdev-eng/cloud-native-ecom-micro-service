# 07 — Relevance with `function_score`

Same query, two scoring strategies side by side:

1. **Plain BM25** — text relevance only.
2. **`function_score`** — BM25 multiplied by:
   - 1.4x bonus when `in_stock = true`,
   - log of `popularity`,
   - Gaussian recency decay over `createdAt` (60-day half-life).

Prints both rankings so you can see how business signals reshape the
order without throwing away text relevance.

## Run

```bash
npm run relevance
```

## What to notice

- A new, popular, in-stock doc that mentioned the query weakly can
  out-rank an old, less popular doc that mentioned it strongly. That is
  usually what you want for a product catalogue.
- `boost_mode: multiply` keeps the BM25 score in the picture; an
  irrelevant doc with sky-high popularity still does not appear.
