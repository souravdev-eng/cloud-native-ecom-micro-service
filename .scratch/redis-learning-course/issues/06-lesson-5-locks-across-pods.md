# 06: Lesson 5, locks across pods

**Parent spec:** `../spec.md`

**What to build:** A lesson that takes the learner from "add a lock" to "you probably don't need a lock", by breaking things in order:

1. Two workers buy the last unit of stock with no protection, and both succeed (oversell).
2. A `SET NX PX` lock with a random token and a token-checked Lua release fixes the happy path.
3. The lock holder is frozen with `SIGSTOP` past its TTL; a second worker takes the lock and writes; the first resumes and writes too. The lock didn't prevent a double write.
4. A fencing token checked by the data store rejects the stale write.
5. The simplest correct answer for inventory: one atomic conditional update (decrement only if enough stock remains), with no lock at all.

The concept covers lease vs lock, why the release must check the token, fencing, when a Redis lock is fine (cache rebuild, cron single-runner) and when it isn't (money, stock). Redlock gets one paragraph, and the Kleppmann/antirez debate goes in the resources file. "In our repo" ties this to how product stock changes on order events.

Writes the locks half of reference sheet 3 (release and extend Lua scripts, a safe/unsafe use list).

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Each of the five steps is a runnable variant whose outcome is printed as a clear verdict (oversold count, double write yes/no)
- [ ] The pause step is deterministic: the holder is paused past its TTL on every run
- [ ] `--check` asserts the expected outcome of all five steps and is part of `labs:verify`
- [ ] No lab process is left stopped or orphaned after a run, including when the check fails
- [ ] The lesson recommends the atomic conditional update for inventory and explains why it beats a lock
- [ ] The locks half of sheet 3 is written; Redlock reading is in the resources file
- [ ] The quiz includes at least one question about an earlier lesson
