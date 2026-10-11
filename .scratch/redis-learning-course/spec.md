# Spec: Redis for distributed systems: a hands-on course

Status: needs-triage

## Problem Statement

The Redis learning material in `sandbox/redis-learning/` doesn't teach. It's about 2,900 lines of docs plus 5 example scripts, and the goal is to learn Redis from basic to advanced in about 3 days instead of the usual 7. Today it fails that goal in five ways:

- **It's a reference book, not a course.** The README says *"This is not an introductory tutorial"*. It has no learning objectives, no lesson order, no exercises, no recall checks and no recap. Every chapter is an encyclopedia entry.
- **It covers too much, all at the same weight.** Nine data types, five rate-limit algorithms, XFetch, GCRA, CSRF tokens, bitmaps, HyperLogLog and geo each get the same space as the core ideas. That much breadth turns 3 days into 7.
- **The distributed side is described but never shown.** Races, lock expiry during a pause, failover data loss and `CROSSSLOT` errors are each mentioned in a sentence. Every example is one process on the happy path, so the learner never *sees* two pods conflict over shared state.
- **It contains errors and contradictions:**
  - Chapters 01 and 02 say products live in Postgres. `product` uses MongoDB.
  - The `redisCache.set` "double-encoding a string" critique is out of date (it now takes `any`). The real bug is that `get()` is typed `string | null` but returns a parsed object.
  - `examples/05-distributed-locks` protects inventory purchases with a Redis lock, which Chapter 04 §4.9 forbids.
  - `examples/06-rate-limiting` runs `INCR` then `EXPIRE` as two separate commands, the race Chapter 05 §5.4 calls wrong.
  - `examples/01-basic-operations` shows a lock with no TTL.
  - Every example runs `flushDb()`.
  - Example numbers don't match chapter numbers. `package.json` has scripts for 3 examples that don't exist.
  - Links are absolute paths to one laptop (`@/Users/...`).
  - The README quickstart runs `docker compose -f ../../tools/docker-compose.yml up -d redis`, but that compose file has no Redis service.
- **It ignores the real system.** `product` has a real consistency bug worth studying, and the docs never mention it:
  - `routes/showProduct.ts` caches search results under `product_search:v2:<md5>` (60 min for `?search=`, 10 min otherwise).
  - `updateProduct`, `deleteProduct` and the `productQuantityUpdate` listener only delete `product:${id}`.
  - So after a price or stock change, the detail page is fresh but search can show the old value for up to an hour.

  The docs also use key names the code doesn't use, describe a Sentinel/StatefulSet setup the cluster doesn't have (`k8s/product-redis-depl.yml` is one unpinned `redis:alpine` Deployment), and don't connect to the observability work that's just been built.

## Solution

Rebuild the material as a **course** in the format that already works for this learner: the observability course in `doc/learn/observability/`.

From the learner's side:

- Open `doc/learn/redis/lessons/0001-…html` and see the same course chrome as the observability course: left sidebar, reading progress, quizzes, and an "In short" recap at the end of each lesson.
- Each lesson starts from a **distributed-systems question** ("three product pods share one Redis: what can go wrong?"), not from a data type. The learner predicts the outcome, runs a lab that **breaks** something, learns the concept that explains it, applies the fix, then finds the same thing in this repo.
- Labs live in `sandbox/redis-learning/` and need one command. They use a local docker-compose Redis (single node, primary + replica + Sentinel, or a 6-node cluster). Three lessons run against the real `product` service in the local `skaffold` cluster.
- Ten lessons of about 25–30 minutes each, planned as three study days:
  - Day 1: Lessons 0–3 (shared state and caching)
  - Day 2: Lessons 4–6 (failure and coordination)
  - Day 3: Lessons 7–9 (replication, cluster, capstone)
- Short **reference sheets** hold the correct, still-useful parts of today's chapters (cheat sheets, decision tables, Lua scripts) for lookup after the course.
- The old `docs/` and `examples/` are removed once their content has been moved or dropped. Git history keeps them.

## User Stories

### Learner

1. As a learner, I want a mission statement with concrete success criteria, so that I know when I've learned enough.
2. As a learner, I want lessons in a fixed order, each about 25–30 minutes long, so that I can finish the course in three study days.
3. As a learner, I want every lesson to open with a question about many processes sharing one Redis, so that I learn Redis as a distributed-systems tool, not a list of commands.
4. As a learner, I want to predict what will happen before each lab runs, so that a wrong guess shows me exactly where my mental model is off.
5. As a learner, I want each lab to make the failure visible (lost updates counted, an oversell, a stale price on screen, a `CROSSSLOT` error), so that I believe the failure is real, not theoretical.
6. As a learner, I want each lab to show the fix working against the same failure, so that I leave with a solution, not just a scare.
7. As a learner, I want every lesson tied to real files in this repo (`product/src/...`, `k8s/...`), so that what I learn transfers straight to the platform I own.
8. As a learner, I want each lesson to end with an "In short" box (2–3 ideas, a one-line fallback, what *not* to memorise), so that rereading is fast.
9. As a learner, I want short quizzes that also ask about earlier lessons, so that I keep what I learned instead of forgetting it.
10. As a learner, I want a short diagnostic at the start, so that I can skim Lesson 0 if I already know the basics.
11. As a learner, I want niche topics moved to "further reading", so that my limited time goes on what matters.
12. As a learner, I want reference sheets I can use after the course, so that I don't have to reread whole lessons to look something up.
13. As a learner, I want a capstone where I review a planted bad Redis diff, so that I can prove I'd catch these mistakes in a real PR.

### Lab user

14. As a lab user, I want one command to start the Redis setup a lesson needs, so that setup never eats into study time.
15. As a lab user, I want labs that can never wipe a Redis I care about, so that running an exercise can't damage the product cache.
16. As a lab user, I want race-condition labs that fail the same way every run, so that a lucky run doesn't hide the lesson.
17. As a lab user, I want a self-check mode for each lab, so that I (and the course author) can confirm the lab still shows what the lesson claims.

## Implementation Decisions

### Where things live

- **Course pages:** `doc/learn/redis/`, mirroring `doc/learn/observability/`:
  - `MISSION.md`: why, success criteria, constraints, out of scope (content below)
  - `NOTES.md`: teaching notes and working notes for the author agent
  - `RESOURCES.md`: further reading, including everything cut from the course
  - `lessons/NNNN-<slug>.html`
  - `reference/NNNN-<slug>.html`
  - `learning-records/NNNN-<slug>.md`
  - `assets/`: copies of `course.css`, `quiz.js`, `sorter.js` and `nav.js` from the observability course, plus this course's own `course-map.js`
- **Runnable labs:** `sandbox/redis-learning/`, which becomes the lab workspace:
  - `docker-compose.yml` with profiles
  - `lib/`: shared helpers
  - `labs/NN-<slug>/`: one folder per lesson that has a local lab
  - `package.json`: one `lab:NN` script per lab plus `labs:verify`
  - `README.md`: how to start each profile and run a lab, pointing at the course for the theory
- **Removed:** `sandbox/redis-learning/docs/`, `examples/`, the stray `examples/package-lock.json` and `.DS_Store`, once their content has been moved to reference sheets or `RESOURCES.md`.
- **Links:** all paths are repo-relative. No absolute `/Users/...` paths.

### Mission (content for `MISSION.md`)

- **Why:** Redis is in the platform (the `product` cache) and is the obvious tool for locks, rate limits and shared state across pods. I want to reason about it as a distributed component, not just call `GET`/`SET`.
- **Success looks like:**
  - I can explain what happens when N pods do read-modify-write on one key, and fix it with an atomic command or Lua.
  - I can find and explain the stale-search-cache bug in `product`, and design the fix.
  - I can choose a TTL, jitter and stampede protection for a cache and defend the choice.
  - I can say what `product` does when Redis is down or slow, and whether that's correct.
  - I can say when a Redis lock is safe, when it isn't, and what to use instead (an atomic Mongo update, an idempotency key).
  - I can explain why an acknowledged write can disappear after failover.
  - I can explain hash slots and hash tags, and read a `CROSSSLOT` error.
  - I can review a Redis-related PR and catch the common mistakes.
- **Constraints:** about 25–30 minutes per lesson; three study days; every concept shown in a lab.
- **Out of scope:** listed under Out of Scope below.

### Lesson format (every lesson)

The lesson body is HTML using `course.css`, mobile-friendly with no wide tables, following the org brand (Lexend/Inter/IBM Plex Mono, navy `#051367`). Sections, in order:

1. **The question:** one distributed-systems scenario in 2–3 sentences.
2. **Predict:** a quiz-style prediction the learner commits to before the lab.
3. **Break it:** the lab, as `ol.steps` with a `<strong>` title per step (required by `nav.js`).
4. **Why it happened:** the concept, with at most one diagram.
5. **Fix it:** the lab's fixed variant, run against the same scenario.
6. **In our repo:** small excerpts (5–10 lines) from real files, explained line by line. Never a whole file or manifest (from the observability teaching notes).
7. **In short:** the `.recap` box.
8. **Check yourself:** 3–5 quiz questions; from Lesson 2 on, at least one about an earlier lesson.

Detail that isn't needed on a first read goes in `<details>` or a reference sheet.

### Lessons

Each entry gives the question, the lab, the concept, the repo anchor, and the environment it runs in.

**0. Shared state across pods** (local, `single`)
- Opens with a 5-question diagnostic. If the learner passes, they skim the lesson. Record the result as learning record 0001.
- Lab: 3 worker processes increment one counter 1,000 times each using `GET` + `SET` and lose updates; switching to `INCR` loses none.
- Concept: Redis is one shared memory reached over the network; the single command thread is what makes one command atomic; one round trip per command.
- Data types are introduced only as later lessons need them (string, hash, sorted set). The full catalogue goes to reference sheet 01.

**1. Cache-aside in `product`** (live cluster)
- Lab: watch `redis-cli MONITOR` (via `kubectl exec` into the product-redis pod) while hitting `GET /api/v1/product/:id` and the search endpoint through ingress. Observe a miss, a set with TTL, then hits. Read the TTL with `TTL`.
- Concept: cache-aside, key design, hashed search keys, tiered TTLs, a cache as a derived copy of MongoDB.
- Repo: `routes/showProductDetailById.ts`, `routes/showProduct.ts`, `utils/cacheKeys.ts`, `cache/redisCache.ts` (including the `get()` type mismatch).

**2. Cache consistency** (live cluster, plus local)
- Live lab: change a product's price, then see the detail page fresh but search stale. That's the real `product_search:v2:*` bug.
- Local lab: the read/write race. A reader misses and loads the old value; a writer updates and deletes the key; the reader then writes the old value back. With the timing forced, the stale value stays until the TTL expires.
- Concept: delete vs update on write, delete after commit, why TTL is the backstop, versioned keys and a generation counter as the fix for "invalidate all search results".
- Repo: `routes/updateProduct.ts`, `routes/deleteProduct.ts`, `queues/listeners/productQuantityUpdate.ts` (cross-service invalidation over RabbitMQ).
- The lesson designs the fix. Applying it to `product` is a separate follow-up ticket (see Out of Scope).

**3. Stampede** (local, `single`)
- Lab: 200 concurrent reads of an expired hot key against a fake slow data store that counts calls. Without protection: ~200 loads. With in-process single-flight: 1 per process. With jittered TTLs on a batch of keys: expiries spread out instead of all hitting at once.
- Concept: stampede, single-flight, jitter, negative caching (`product` only caches non-empty search results). Soft TTL and XFetch get one paragraph and a pointer to `RESOURCES.md`.

**4. When Redis is down or slow** (live cluster, plus local)
- Live lab: `kubectl scale deploy product-redis-deployment --replicas=0`, then call product endpoints. Observe what actually happens (error, hang, or fallback to Mongo) and record it. Scale back up and watch reconnection.
- Local lab: Toxiproxy adds 2 s latency to Redis; compare a client with no command timeout to one with a timeout plus a fallback to the data store.
- Concept: a cache should be optional; fail open vs fail closed; timeouts; reconnect strategy; readiness checks (links to the health contract from the observability work).
- Repo: `redisClient.ts` (no reconnect strategy, no timeout), how routes handle Redis errors, `k8s/product-redis-depl.yml`.

**5. Locks across pods** (local, `single`)
- Lab A: two workers "buy" the last unit of stock with no lock, and both succeed (oversell).
- Lab B: a `SET NX PX` lock with a token-checked Lua release fixes it on the happy path.
- Lab C: the holder is frozen with `SIGSTOP` past its TTL; a second worker takes the lock; the frozen one resumes and writes as well. The lock didn't prevent a double write.
- Fix: a fencing token checked by the data store, then the simpler right answer for inventory: one atomic conditional update (`findOneAndUpdate` with `quantity: { $gte: n }`) and no lock at all.
- Concept: lease vs lock, token-checked release, fencing; when a Redis lock is fine (cache rebuild, cron single-runner); Redlock as one paragraph plus the Kleppmann/antirez reading in `RESOURCES.md`.

**6. Rate limiting across replicas** (local, `single`)
- Lab A: an in-memory limiter behind 3 processes lets through 3× the limit.
- Lab B: a Redis fixed window with `INCR` + `EXPIRE` as two calls; kill the process between them and a key is left with no TTL, so the user is locked out forever.
- Lab C: the same limiter as one Lua script, then a token bucket allowing bursts.
- Concept: why per-process state breaks with replicas, Lua for atomicity, fixed window vs token bucket, `429` + `Retry-After`. Sliding window counter gets one paragraph; GCRA and sliding log go to `RESOURCES.md`.
- Repo anchor: a design exercise. Where would a login throttle go in `auth`, and should it fail open or closed?

**7. Replication and failover** (local, `replication`)
- Lab A: write to the primary, read the replica straight away, and sometimes see the old value (replication lag).
- Lab B: pause replication, write and get an acknowledgement, kill the primary, let Sentinel promote the replica: the write is gone.
- Lab C: `WAIT 1 <timeout>` narrows the gap but is not a durability guarantee.
- Lab D: a lock acquired just before failover exists on the old primary only, so a second client acquires it on the new one.
- Concept: asynchronous replication, Sentinel quorum and promotion, what persistence (RDB/AOF) does and doesn't protect against, why the `product` cache can tolerate loss but locks and sessions can't.

**8. Cluster and sharding** (local, `cluster`)
- Lab: create a 6-node cluster (3 primaries, 3 replicas). `CLUSTER KEYSLOT` shows where keys land. A two-key Lua script fails with `CROSSSLOT`; with `{hash tags}` it works. Watch a `MOVED` redirect with `redis-cli` without `-c`.
- Concept: 16,384 hash slots, client-side routing, hash tags and the hot-shard risk they bring, Pub/Sub scope. When to move to Cluster and when Sentinel is enough.

**9. Capstone: review a Redis diff** (no lab environment)
- A planted diff against `product` with 6–8 mistakes taken from the course (for example: `KEYS *` for invalidation, a lock with no TTL, `INCR`/`EXPIRE` as two calls, no jitter, caching a value that is never invalidated, `flushDb` in a script, unbounded `HGETALL`).
- The learner writes review comments, then compares them against an answer key in `<details>`. Ends with explaining the stale-search-cache fix aloud.

### Reference sheets

Trimmed from today's chapters, with every factual error listed in the Problem Statement corrected:

1. Commands and data types: only what lessons use, plus time complexity and the "unbounded O(N) is an incident" rule.
2. Caching and invalidation: pattern decision list, TTL defaults, the stampede mitigation layers.
3. Locks and rate limiters: release, extend and limiter Lua scripts, plus when each is safe.
4. Operations: persistence, replication, Sentinel, Cluster, eviction policies (`allkeys-lfu` for caches, `noeviction` for coordination), big keys and hot keys, the metrics to watch.
5. Glossary: one meaning per term, used consistently in every lesson (e.g. "lease", "fencing token", "single-flight", "system of record").
6. Redis review checklist, the one used by the capstone.

Everything else from the old chapters goes in `RESOURCES.md` as further reading: sessions/CSRF, GCRA, sliding log, XFetch, `CLIENT TRACKING`, Streams vs RabbitMQ, bitmaps, HyperLogLog, geo, ACL/TLS.

### Lab environment (`sandbox/redis-learning/`)

- **One `docker-compose.yml` with profiles**, Redis image pinned to an exact 7.x tag:
  - `single`: one Redis on host port `6390`, plus Toxiproxy (Redis via proxy on `6391`, API on `8474`).
  - `replication`: primary, one replica and 3 Sentinels.
  - `cluster`: 6 nodes, plus a one-shot `cluster-init` container.
- **Replication and cluster labs run inside a `lab-runner` container** on the compose network. Sentinel and Cluster advertise container addresses; running inside the network avoids Docker Desktop NAT problems. The `single` profile labs run from the host.
- **Ports:** `6390+` avoids clashing with any `kubectl port-forward` to the cluster Redis on `6379`.
- **Client:** `redis` (node-redis) at the same major version as `product/` (4.x), so the code transfers. TypeScript run with `tsx` or `ts-node`, whichever the implementer gets working without config.
- **`lib/` helpers:**
  - `connect()`: refuses to run unless the target is a local sandbox endpoint (localhost on `6390`–`6399`, or a compose service hostname). There is no override flag. Live-cluster lessons use `redis-cli` via `kubectl exec` and never run lab code against the cluster.
  - `runConcurrently(n, fn)`: starts N separate worker **processes**, not promises, so "many pods" is literal.
  - `barrier` and `pauseAt(step)`: force race timing so that broken variants fail every run.
  - `slowStore`: a fake system of record with configurable latency and a load counter, used by Lessons 2, 3 and 5.
  - `withPrefix(lab)` and `cleanup(prefix)`: every lab writes under `lab:NN:*` and cleans up only that prefix with `SCAN` + `UNLINK`. `FLUSHDB` and `FLUSHALL` never appear in lab code.
  - Console output style: short labelled lines and a clear verdict at the end, e.g. `lost updates: 1,742 ✗` or `oversold: 0 ✓`.
- **Each lab has a `broken` and a `fixed` variant**, selected by a flag. The lesson runs both.

### Course chrome

- `course-map.js` lists the 10 lessons and 6 reference sheets; unwritten ones have `href: null`.
- Every page loads `quiz.js` (when it has quizzes), `course-map.js` and `nav.js`, as in the observability course.
- `NOTES.md` starts with the learner preferences carried over from the observability notes: concept before implementation, small config excerpts explained line by line, an "In short" box on every lesson, a recall check at the start of each session, and lessons that can be reread.

## Testing Decisions

- **Labs must prove the lesson.** Each lab has a `--check` mode that runs both variants and checks the claim in code. Examples:
  - Lesson 0: broken variant loses more than 0 updates; fixed variant loses exactly 0.
  - Lesson 5: broken variant oversells; fixed variant doesn't.
  - Lesson 8: the untagged script throws `CROSSSLOT`; the tagged one succeeds.

  `npm run labs:verify` runs the checks for every local lab against the profile it needs and exits non-zero on any mismatch. That's the regression guard if Redis or client versions change.
- **No flaky labs.** Broken variants rely on `barrier`/`pauseAt`, not luck. A broken variant that passes "by luck" is a lab bug. `labs:verify` runs each check 3 times.
- **Lab safety check:** a test confirms `connect()` throws for a non-sandbox URL (e.g. `redis://product-redis-service:6379` or `localhost:6379`).
- **Live-cluster lessons (1, 2, 4) are verified by hand** against `skaffold dev` before the lesson is marked written. The observed behaviour (for example, what `product` actually does with Redis scaled to 0) is written into the lesson, not guessed. If the cluster is down while writing, `NOTES.md` must say the lab wasn't run live; the observability course's Lessons 3–6 show why this matters.
- **Pages:** every lesson and reference page loads without console errors, appears in `course-map.js`, and its quizzes work. Spot-checked in a browser at phone width.
- No changes to service code, so no service test suites are affected.

## Out of Scope

- **Fixing the stale-search-cache bug or other gaps in `product`** (`redisClient.ts` reconnect/timeout, the `get()` type mismatch). The course designs the fixes. Applying them is a separate `.scratch/` ticket, filed when this course is done.
- Changing `k8s/product-redis-depl.yml` (pinning the image, Sentinel, StatefulSet). Covered as discussion in Lesson 7 and the operations sheet only.
- Adding Redis to any other service (`auth` login throttle, `order` idempotency). Lesson 6 has a design exercise only.
- Sessions, CSRF, refresh-token stores, Redis Streams as a queue, RediSearch, Redis Stack modules, ACL/TLS hardening, managed Redis (ElastiCache, Redis Cloud). These go in `RESOURCES.md` as further reading.
- Running Redis at production scale, or benchmarking.
- Sharing `assets/` between the observability and Redis courses. They're copied for now (see Further Notes).
- The other sandboxes (`rabbitmq-learning`, `elasticsearch-learning`, `observability-learning`).

## Further Notes

- **Suggested ticket order** for `issues/NN-*.md`:
  1. Lab foundation: compose profiles, `lib/` (with the safety guard and its test), `labs:verify` skeleton.
  2. Course scaffold: `doc/learn/redis/` with `MISSION.md`, `NOTES.md`, `RESOURCES.md`, copied assets, `course-map.js` with all entries set to `null`.
  3. Lessons 0 and 3 (local, `single`): labs + pages.
  4. Lessons 1, 2 and 4 (live cluster + local labs): pages, verified against `skaffold dev`.
  5. Lessons 5 and 6: labs + pages.
  6. Lesson 7 (`replication`) and Lesson 8 (`cluster`): labs + pages.
  7. Reference sheets 1–6, with the factual corrections.
  8. Lesson 9 capstone, then remove the old `docs/` and `examples/` and rewrite the sandbox README.
- **Copied assets.** `course.css`, `quiz.js`, `sorter.js` and `nav.js` are generic. Copying them keeps this course independent of the observability course. If a third course appears, move them to a shared `doc/learn/_assets/`.
- **Lesson 4's live result is unknown.** Nobody has checked yet what `product` does when Redis is unreachable: whether routes catch Redis errors, whether `connectRedis` at startup blocks boot, and how long a command waits. Find out before writing the lesson.
- **Link to observability.** Where it fits naturally, labs mention the Redis signals the observability platform will chart (cache hit ratio by query type, Redis exporter metrics). No dependency on that work being finished.
- **Time budget check.** If a lesson's lab plus reading runs over 35 minutes in practice, split the lesson rather than cutting the lab.
