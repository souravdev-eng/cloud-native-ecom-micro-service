# 01: Lesson 0, shared state across pods (tracer bullet)

**Parent spec:** `../spec.md`

**What to build:** The first complete lesson, built end to end. It proves the whole pipeline (local Redis, lab helpers, self-checking lab, course page) before more lessons are added.

The learner runs one command to start a local single-node Redis. They take a 5-question diagnostic, predict what happens when three worker processes increment one counter with `GET` + `SET`, and run the broken lab: it reports how many updates were lost. They run the fixed lab (`INCR`) and see zero lost updates. The page then explains why (one shared memory reached over the network, a single command thread, one round trip per command) and ends with an "In short" box and quiz.

This ticket also lays the foundation every later lesson reuses:
- The `single` compose profile, with the Redis image pinned to an exact 7.x tag and the host port in the sandbox range (not 6379).
- The shared lab helpers:
  - a connection guard that refuses anything other than the local sandbox Redis;
  - a helper that starts N separate worker **processes**;
  - a barrier that forces race timing;
  - per-lab key prefixes with prefix-only cleanup.
- The `labs:verify` runner.
- The course scaffold, mirroring the observability course:
  - mission, teaching notes and resources files;
  - copied generic assets;
  - a course map listing all 10 lessons and 6 reference sheets (unwritten ones marked "coming").
- Reference sheet 1 (commands and data types), with only what Lesson 0 uses so far.
- The glossary, started with Lesson 0's terms.

The teaching notes start with the learner preferences carried over from the observability course's notes.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] One command starts the `single` profile; Redis is reachable on the sandbox port, not 6379
- [x] The connection guard throws for a non-sandbox URL (e.g. the cluster's product-redis service or `localhost:6379`), and a test covers this
- [x] Lab code never calls `FLUSHDB`/`FLUSHALL`; each lab writes under its own `lab:NN:*` prefix and cleans up only that prefix
- [x] The broken variant loses more than 0 updates on every run (timing is forced, not left to luck); the fixed variant loses exactly 0
- [x] `--check` asserts both outcomes; `labs:verify` runs it 3 times and exits non-zero on any mismatch
- [x] The Lesson 0 page follows the lesson format from the spec (question, predict, break it, why, fix, in our repo, In short, check yourself) and opens with the diagnostic
- [x] `MISSION.md` carries the spec's success criteria; `NOTES.md` carries the learner preferences; the course map lists every planned page
- [x] Reference sheet 1 and the glossary exist, are linked from the course map, and contain none of the factual errors listed in the spec
- [x] All links are repo-relative; pages load without console errors and read well at phone width
- [x] A learning record template is in place, ready to record the diagnostic result after the first session

## Comments

- 2026-10-11: Implemented, uncommitted for review. Lesson 0 is `doc/learn/redis/lessons/0000-shared-state-across-pods.html` (files are numbered after the lesson, so Lesson 0 ↔ `0000-…` ↔ `labs/00-…` ↔ `lab:00:*`, rather than the spec's `0001-…`). Lab run on `redis:7.4.11-alpine` + node-redis 4.7.1: forced timing loses exactly 2,000/3,000 every run, `INCR` loses 0; `labs:verify` passes 3/3 and exits 1 when the fixed variant is sabotaged. Tests live in `sandbox/redis-learning/lib/__test__/`. Toxiproxy is left to ticket 05, which is the first lesson that needs it.
