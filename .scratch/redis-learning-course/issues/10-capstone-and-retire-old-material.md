# 10: Lesson 9 capstone + retire the old material

**Parent spec:** `../spec.md`

**What to build:** The course's final lesson, and the cleanup that makes the course the single source of truth.

**Capstone:** the learner reviews a planted diff against `product` containing 6–8 mistakes taken from the course, for example:
- `KEYS *` used for invalidation
- a lock with no TTL
- `INCR` and `EXPIRE` as two separate calls
- no TTL jitter
- caching a value that's never invalidated
- `FLUSHDB` in a script
- an unbounded `HGETALL`

They write review comments, then compare against an answer key in `<details>`. The lesson ends with the learner explaining the stale-search-cache fix aloud. Reference sheet 6 (Redis review checklist) is written alongside it.

**Retire the old material:**
- Finish the resources file with every topic cut from the course.
- Delete the old `docs/` and `examples/` folders (plus the stray lockfile and `.DS_Store`) from the Redis sandbox.
- Rewrite the sandbox README as a lab guide that points to the course for the theory.
- File a follow-up ticket in `.scratch/` for applying the stale-search-cache fix (and the client timeout/reconnect gaps from Lesson 4) to `product`.

**Blocked by:** 04, 05, 07, 09

**Status:** ready-for-agent

- [ ] Every planted mistake maps to a lesson, and the answer key names that lesson
- [ ] Reference sheet 6 exists and the capstone uses it
- [ ] The course map has no "coming" entries left; every lesson and reference sheet is linked and loads without console errors
- [ ] Every useful topic from the old chapters is either in a lesson, a reference sheet, or the resources file, and nothing is silently dropped
- [ ] The old `docs/` and `examples/` folders are gone; the sandbox README explains how to start each profile, run a lab and run `labs:verify`, with no absolute paths
- [ ] `labs:verify` passes for every local lab from a clean checkout
- [ ] A follow-up ticket for the `product` cache fixes exists under `.scratch/`, with a short problem statement linking to Lessons 2 and 4
