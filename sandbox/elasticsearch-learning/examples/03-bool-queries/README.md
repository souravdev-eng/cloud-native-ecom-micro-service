# 03 — Bool Queries

Loads the seed catalogue and runs the same logical query four ways:
`must`, `filter`, `must_not`, `should`. Prints which docs come back and
their scores so you can see filter context = no score.

## Run

```bash
npm run bool-queries
```

## What to notice

- `filter` clauses produce `_score = 0` (or contribute nothing); `must`
  clauses produce a non-zero score.
- Same logical result, two different query shapes — pick `filter` for
  category/price/in-stock, `must` for the user's typed text.
