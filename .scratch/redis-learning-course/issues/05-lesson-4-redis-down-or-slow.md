# 05: Lesson 4, when Redis is down or slow

**Parent spec:** `../spec.md`

**What to build:** A lesson that answers "what does our platform do when its cache breaks?" with evidence, not guesses.

1. **Live:** with `skaffold dev` running, the learner scales the product-redis deployment to 0 and calls the product endpoints. They record what actually happens (an error, a hang, or a fallback to MongoDB, and how long it takes), then scale back up and watch the client reconnect.
2. **Local:** Toxiproxy (added to the `single` profile) puts 2 s of latency in front of Redis. A client with no command timeout stalls every request; a client with a timeout and a fallback to the data store stays fast.

The concept covers "a cache should be optional", fail open vs fail closed, command timeouts, reconnect strategy, and readiness checks (linking to the health contract from the observability work). "In our repo" looks at how the product Redis client is set up (no reconnect strategy, no timeout), how routes handle Redis errors, and a short excerpt of the Redis deployment.

The live result isn't known yet: whether routes catch Redis errors, whether startup blocks on connecting, how long a command waits. Find out before writing the lesson.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Toxiproxy runs in the `single` profile, and the lab adds and removes latency through its API
- [ ] Broken variant: request latency ≥ the injected delay; fixed variant: latency stays bounded by the timeout and the answer comes from the fallback; `--check` asserts both and is part of `labs:verify`
- [ ] The live behaviour was observed against `skaffold dev` and written into the lesson (or `NOTES.md` says it wasn't run live)
- [ ] The live lab always scales Redis back to 1 replica at the end, and the lesson says so clearly
- [ ] The lesson says whether the current behaviour is acceptable and what the fix would be, without changing `product` code
- [ ] The quiz includes at least one question about an earlier lesson
