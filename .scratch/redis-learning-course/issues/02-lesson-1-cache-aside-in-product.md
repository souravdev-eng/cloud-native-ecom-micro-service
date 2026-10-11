# 02: Lesson 1, cache-aside in `product`

**Parent spec:** `../spec.md`

**What to build:** A lesson that shows the learner the real `product` cache working in the local cluster. With `skaffold dev` running, the learner opens `redis-cli MONITOR` inside the product-redis pod, calls the product detail endpoint and then the search endpoint through ingress, and watches each call: a miss, a `SET` with a TTL, then hits. They read the remaining TTL and compare the two key shapes: plain id keys for detail, hashed `product_search:v2:*` keys for search.

The concept covers cache-aside, key design, why search keys are hashed, the tiered TTLs (60 min for text search, 10 min otherwise), and the cache as a derived copy of MongoDB. "In our repo" walks short excerpts of the detail route, the search route, the cache-key generator and the cache wrapper, and points out that the wrapper's `get()` claims to return a string but returns a parsed object.

Starts reference sheet 2 (caching and invalidation) with the cache-aside pattern and TTL defaults. Adds new terms to the glossary.

**Blocked by:** 01

**Status:** ready-for-agent

- [x] The lab steps were run against a live `skaffold dev` cluster, and the output shown in the lesson matches what was actually seen (if the cluster was down, `NOTES.md` says the lab wasn't run live)
- [x] The lab only reads from or watches the cluster Redis (`MONITOR`, `GET`, `TTL`); nothing is written, deleted or flushed
- [x] The lesson states the real key names and TTLs from the code, not the made-up ones in the old docs
- [x] The lesson correctly says `product` is backed by MongoDB
- [x] Code excerpts are 5–10 lines, explained line by line
- [x] Reference sheet 2 exists with the cache-aside section; the course map links Lesson 1 and sheet 2
- [x] The quiz includes at least one question about Lesson 0

## Comments

- 2026-10-11: Implemented, uncommitted for review. Lesson 1 is `doc/learn/redis/lessons/0001-cache-aside-in-product.html`; reference sheet 2 is `reference/0002-caching-and-invalidation.html`. The lab was run live against the `minimal` profile (built with `skaffold build --push=false` and deployed with `skaffold deploy`, because `skaffold.yaml` sets `push: true`); every output in the lesson is copied from that run. Only the curl login step wasn't run with a real account (requests used a session cookie minted like the auth tests do); `NOTES.md` records this. The lesson's "break and fix" is the old search-key generator, which ignored `quantity`: its colliding keys were computed from the pre-`2692620` code, and the lesson says so. Also: commands sheet gains `TTL`/`INFO`, the glossary gains a Caching section (and the lab-only "key prefix" became "lab prefix"), and Lesson 0 now links forward.
- 2026-10-11: Fixes from `/code-review`: the setup now gives the commands actually run (`skaffold build --push=false` + `skaffold deploy`) with a `<details>` on why not `skaffold dev`; removed the false "secure cookie" claim (auth sets `secure: false`); the `get()` type example now compiles under `strict` and throws at runtime, as the quiz says; the read-only callout lists `PING`/`INFO` too; the Lesson 0 recall question is now about lost updates; the story gains a "hidden problem" beat; cache-key wording matches the glossary.
