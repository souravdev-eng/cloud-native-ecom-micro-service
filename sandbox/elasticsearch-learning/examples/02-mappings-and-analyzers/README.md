# 02 — Mappings & Analyzers

Define an explicit mapping with a custom analyzer (lowercase + ASCII fold
+ English stop words). Use the `_analyze` API to see the tokens. Show
the difference between `text` (analyzed) and `keyword` (exact) on the
same `brand` field.

## Run

```bash
npm run mappings
```

## What to notice

- `_analyze` shows tokens **before** any document is indexed. Use this
  to debug "why doesn't my query match?".
- `term` on `brand` (a `keyword`) matches `"Acme"` exactly; `term` on
  `title` (a `text` field tokenised lowercase) requires the lowercased
  token `"acme"`.
- `match` on `title` works either way because it analyses the input.
