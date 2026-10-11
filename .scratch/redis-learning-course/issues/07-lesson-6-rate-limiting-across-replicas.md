# 07: Lesson 6, rate limiting across replicas

**Parent spec:** `../spec.md`

**What to build:** A lesson where the learner sees why a rate limiter must use shared state, and then why that state must be updated atomically.

1. An in-memory limiter set to N requests per window runs behind 3 worker processes, and about 3×N requests get through.
2. A Redis fixed window built from `INCR` then `EXPIRE` as two separate calls. When the process is killed between them, the key is left with no TTL and that user is locked out forever.
3. The same limiter as one Lua script fixes both problems. A token bucket follows, allowing short bursts.

The concept covers per-process state vs shared state, Lua scripts for atomicity, fixed window vs token bucket, and `429` with `Retry-After`. The sliding window counter gets one paragraph; GCRA and the sliding log go in the resources file. "In our repo" is a design exercise: where a login throttle would go in `auth`, what key it would use, and whether it should fail open or closed.

Writes the rate-limiter half of reference sheet 3.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Step 1 prints allowed requests ≈ 3× the limit; step 3 prints allowed = the limit
- [ ] Step 2 deterministically leaves a key with TTL `-1` and shows the resulting permanent lockout
- [ ] The token bucket variant shows a burst being allowed, then throttling at the sustained rate
- [ ] `--check` asserts all outcomes and is part of `labs:verify`
- [ ] The `auth` design exercise has an answer in a `<details>` block
- [ ] The rate-limiter half of sheet 3 is written; GCRA and the sliding log are in the resources file
- [ ] The quiz includes at least one question about an earlier lesson
