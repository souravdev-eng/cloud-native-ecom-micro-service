# 03: Lesson 2, cache consistency

**Parent spec:** `../spec.md`

**What to build:** A lesson where the learner sees a cache go stale in two ways.

1. **Live, on the real system:** in the local cluster the learner changes a product's price, then opens its detail page (fresh) and runs a search that includes it (still the old price). The cause: updates, deletes and the quantity-update listener only delete the detail key, and nothing ever invalidates `product_search:v2:*` entries.
2. **Local, the classic race:** a reader misses and loads the old value from a slow fake data store; a writer updates the store and deletes the key; the reader then writes the old value back. With the timing forced, the stale value stays until its TTL runs out. The fixed variant shows how a versioned key or generation counter stops the stale value being served.

The concept covers delete vs update on write, delete after commit, TTL as the backstop, and versioned keys or a generation counter as the way to "invalidate all search results". "In our repo" shows the update, delete and quantity-listener invalidation (cross-service, over RabbitMQ). The lesson **designs** the stale-search fix; applying it to `product` is out of scope.

Adds the shared `slowStore` helper (fake data store with configurable latency and a load counter) and the `pauseAt` helper for forcing interleavings. Lessons 3–5 reuse both.

**Blocked by:** 02

**Status:** ready-for-agent

- [x] The live stale-search demo was run against `skaffold dev`, with steps and observed output recorded in the lesson (or `NOTES.md` says it wasn't run live)
- [x] The live demo restores the original price at the end
- [x] The race lab's broken variant leaves a stale value in the cache on every run; the fixed variant doesn't; `--check` asserts both and is part of `labs:verify`
- [x] `slowStore` and `pauseAt` are in the shared helpers with a short usage note
- [x] The lesson's fix design names which keys to invalidate or version and why, without changing `product` code
- [x] Reference sheet 2 gains the invalidation section; the glossary gains new terms
- [x] The quiz includes at least one question about an earlier lesson

## Comments

- 2026-10-11: Implemented, uncommitted for review. Lesson 2 is `doc/learn/redis/lessons/0002-cache-consistency.html`; the lab is `sandbox/redis-learning/labs/02-cache-consistency/` (`npm run lab:02`, in `labs:verify`); the helpers are `lib/slowStore.ts` and `lib/pauses.ts` with tests in `lib/__test__/`. The live demo was run against the `minimal` cluster and the price restored; it uses the Tanjiro figure, not the Kindle, because `PATCH` on the Kindle returns 500 (seed data lacks required `originalPrice`/`stockQuantity`). `NOTES.md` records the run, the side effects left (`updatedAt`, two discarded `product-updated` messages in cart), and two repo findings: nothing publishes `product-quantity-updated`, and `newProduct` never touches the cache. Reference sheet 2 gains the invalidation section, the glossary gains 9 terms, Lesson 1 links forward.
- 2026-10-11: Fixes from `/code-review`: `--check` now proves the old price stays for the whole TTL (3 s in check mode, ±1 s) and that the fixed variant's race really ran (the old price is left under edition 0); the lab banner says "edition number", the word the lesson uses until "Now name it"; the `deleteProduct` excerpt is explained line by line; "backstop TTL" matches the glossary; the `pauses.ts` connection note is accurate; NOTES records why the lesson has two break cycles. Also found by review, not fixed (out of scope): the comment at `order/src/service/order.service.ts:123` assumes `product` consumes `order-created`, which it doesn't.
