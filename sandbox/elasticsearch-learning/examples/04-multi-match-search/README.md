# 04 — Multi-Match Search

Search across `title`, `description`, and `brand` with field boosts and
fuzziness. Add a phrase-bonus `should` clause and observe how the same
docs reorder.

## Run

```bash
npm run multi-match
```

## What to notice

- The user query has a typo (`runing`); fuzziness `AUTO` still finds it.
- Without phrase-bonus, `"Acme Red Running Shoes"` and `"Acme Blue
  Running Socks"` score similarly. With phrase-bonus, the running-shoes
  doc jumps because the title contains the exact phrase.
