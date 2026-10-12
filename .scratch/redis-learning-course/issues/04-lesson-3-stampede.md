# 04: Lesson 3, stampede

**Parent spec:** `../spec.md`

**What to build:** A lesson where the learner causes a cache stampede and then stops it. A hot key has expired; 200 concurrent reads all miss and hit the slow fake data store, and the lab prints about 200 loads. With in-process single-flight, it drops to 1 load per worker process. A second part fills a batch of keys with the same TTL, shows them all expiring together, then uses TTL jitter to spread the expiries out.

The concept covers stampede, single-flight (and why it's per process, not per cluster), jitter and negative caching. It points out that `product` caches search results only when they're non-empty, so empty results never get cached. Soft TTL and XFetch get one paragraph and a pointer to the resources file.

Adds the stampede mitigation layers to reference sheet 2.

**Blocked by:** 03

**Status:** ready-for-agent

- [x] Broken variant: loads ≈ number of concurrent readers; fixed variant: loads = number of worker processes; `--check` asserts both with clear thresholds
- [x] The jitter part shows clustered vs spread expiry times in a readable form (e.g. a small text histogram)
- [x] `--check` is part of `labs:verify` and passes 3 runs in a row
- [x] Reference sheet 2 gains the stampede mitigation section; the resources file lists soft TTL and XFetch
- [x] The quiz includes at least one question about an earlier lesson

## Comments

- 2026-10-11: Implemented locally. Lesson `doc/learn/redis/lessons/0003-stampede.html`, lab `sandbox/redis-learning/labs/03-stampede/` and `npm run lab:03` added; course navigation, caching reference, glossary, Resources and README updated. Four real worker processes handle 200 reads: exactly 200 loads broken, 4 fixed, all replies correct. Batch histograms read Redis expiry deadlines and check actual key existence after the base deadline. Typechecking and `labs:verify` pass (all labs, three consecutive runs); disabling single-flight makes the check exit 1. Local links and quiz answer indices validated. Browser policy blocks local-file preview, so visual browser verification was not performed. Product code is unchanged.
