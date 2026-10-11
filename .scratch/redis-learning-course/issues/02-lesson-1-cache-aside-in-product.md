# 02: Lesson 1, cache-aside in `product`

**Parent spec:** `../spec.md`

**What to build:** A lesson that shows the learner the real `product` cache working in the local cluster. With `skaffold dev` running, the learner opens `redis-cli MONITOR` inside the product-redis pod, calls the product detail endpoint and then the search endpoint through ingress, and watches each call: a miss, a `SET` with a TTL, then hits. They read the remaining TTL and compare the two key shapes: plain id keys for detail, hashed `product_search:v2:*` keys for search.

The concept covers cache-aside, key design, why search keys are hashed, the tiered TTLs (60 min for text search, 10 min otherwise), and the cache as a derived copy of MongoDB. "In our repo" walks short excerpts of the detail route, the search route, the cache-key generator and the cache wrapper, and points out that the wrapper's `get()` claims to return a string but returns a parsed object.

Starts reference sheet 2 (caching and invalidation) with the cache-aside pattern and TTL defaults. Adds new terms to the glossary.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The lab steps were run against a live `skaffold dev` cluster, and the output shown in the lesson matches what was actually seen (if the cluster was down, `NOTES.md` says the lab wasn't run live)
- [ ] The lab only reads from or watches the cluster Redis (`MONITOR`, `GET`, `TTL`); nothing is written, deleted or flushed
- [ ] The lesson states the real key names and TTLs from the code, not the made-up ones in the old docs
- [ ] The lesson correctly says `product` is backed by MongoDB
- [ ] Code excerpts are 5–10 lines, explained line by line
- [ ] Reference sheet 2 exists with the cache-aside section; the course map links Lesson 1 and sheet 2
- [ ] The quiz includes at least one question about Lesson 0
