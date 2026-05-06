# 08 — Zero-Downtime Reindex with Alias Swap

Demonstrates the canonical mapping-migration flow:

1. Create `products_v1` and seed it.
2. Point alias `products` at `products_v1`.
3. Search via the alias.
4. Create `products_v2` with a **new** mapping (English analyzer added).
5. Reindex `v1 → v2` server-side via the `_reindex` API.
6. Atomically swap the alias to point at `v2`.
7. Search via the alias — the client never knew anything happened.

## Run

```bash
npm run reindex
```

## What to notice

- The alias swap (`POST /_aliases`) is a single atomic operation: there
  is no moment where the alias points at neither index.
- After the swap, querying `products` hits `products_v2` and English
  stemming kicks in (`"running"` matches `"runs"`).
- We delete `products_v1` at the end. In production you would keep it
  for rollback for at least one cycle.
