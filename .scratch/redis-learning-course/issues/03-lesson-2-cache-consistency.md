# 03: Lesson 2, cache consistency

**Parent spec:** `../spec.md`

**What to build:** A lesson where the learner sees a cache go stale in two ways.

1. **Live, on the real system:** in the local cluster the learner changes a product's price, then opens its detail page (fresh) and runs a search that includes it (still the old price). The cause: updates, deletes and the quantity-update listener only delete the detail key, and nothing ever invalidates `product_search:v2:*` entries.
2. **Local, the classic race:** a reader misses and loads the old value from a slow fake data store; a writer updates the store and deletes the key; the reader then writes the old value back. With the timing forced, the stale value stays until its TTL runs out. The fixed variant shows how a versioned key or generation counter stops the stale value being served.

The concept covers delete vs update on write, delete after commit, TTL as the backstop, and versioned keys or a generation counter as the way to "invalidate all search results". "In our repo" shows the update, delete and quantity-listener invalidation (cross-service, over RabbitMQ). The lesson **designs** the stale-search fix; applying it to `product` is out of scope.

Adds the shared `slowStore` helper (fake data store with configurable latency and a load counter) and the `pauseAt` helper for forcing interleavings. Lessons 3–5 reuse both.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] The live stale-search demo was run against `skaffold dev`, with steps and observed output recorded in the lesson (or `NOTES.md` says it wasn't run live)
- [ ] The live demo restores the original price at the end
- [ ] The race lab's broken variant leaves a stale value in the cache on every run; the fixed variant doesn't; `--check` asserts both and is part of `labs:verify`
- [ ] `slowStore` and `pauseAt` are in the shared helpers with a short usage note
- [ ] The lesson's fix design names which keys to invalidate or version and why, without changing `product` code
- [ ] Reference sheet 2 gains the invalidation section; the glossary gains new terms
- [ ] The quiz includes at least one question about an earlier lesson
