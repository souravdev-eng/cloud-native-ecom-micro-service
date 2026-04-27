# 05 — Autocomplete: three approaches side by side

Builds three indices with the same documents and the same prefix query
(`"red ru"`), so you can compare:

1. **Edge n-grams** (custom analyzer, full query power).
2. **`search_as_you_type`** field type (one-line setup).
3. **`completion` suggester** (in-memory FST, fastest).

Prints latency and the index size for each.

## Run

```bash
npm run autocomplete
```

## What to notice

- `completion` suggester returns **suggestion strings**, not documents
  (the document is in `_source` of the option).
- `search_as_you_type` matches mid-phrase too (try `"running"` after
  the example runs by tweaking the constant).
- Edge n-grams need a different **search analyzer** than the
  **index analyzer**, otherwise the query is also n-gram'd and matches
  too much.
