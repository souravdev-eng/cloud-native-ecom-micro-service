# 08: Lesson 7, replication and failover

**Parent spec:** `../spec.md`

**What to build:** A lesson where the learner watches Redis lose data that it acknowledged. A new `replication` profile runs a primary, one replica and three Sentinels. The labs run in a `lab-runner` container on the compose network, so Sentinel's advertised addresses resolve correctly.

1. Write to the primary and read the replica straight away; sometimes the old value comes back (replication lag).
2. Pause replication, write and get an acknowledgement, kill the primary, and let Sentinel promote the replica. The acknowledged write is gone.
3. `WAIT 1 <timeout>` narrows that window, but the lab shows it is not a durability guarantee.
4. A lock taken on the old primary just before failover is missing on the new primary, so a second client gets the same lock. This ties back to Lesson 5.

The concept covers asynchronous replication, Sentinel quorum and promotion, what RDB/AOF persistence does and doesn't protect against, and why the `product` cache can tolerate this loss while locks and sessions can't.

Writes the replication and persistence half of reference sheet 4 (operations).

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] One command starts the `replication` profile; Sentinel reports the primary and replica as healthy before labs run
- [ ] Each lab step is deterministic (replication paused or primary killed by the lab itself, not by timing luck)
- [ ] Step 2 shows the acknowledged write missing after promotion; step 4 shows two clients holding the same lock
- [ ] `--check` asserts every outcome, runs from the `lab-runner` container, and is part of `labs:verify` (which starts and stops the profile it needs)
- [ ] After a run, the profile is back to a healthy primary + replica, or `labs:verify` recreates it
- [ ] The replication and persistence half of sheet 4 is written
- [ ] The quiz includes at least one question about an earlier lesson
