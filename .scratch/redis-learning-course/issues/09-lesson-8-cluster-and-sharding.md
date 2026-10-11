# 09: Lesson 8, cluster and sharding

**Parent spec:** `../spec.md`

**What to build:** A lesson where the learner runs a real Redis Cluster and hits its limits. A new `cluster` profile runs 6 nodes (3 primaries, 3 replicas) plus a one-shot init container that forms the cluster. Labs run in the `lab-runner` container from the previous ticket.

The learner:
- uses `CLUSTER KEYSLOT` to see which slot, and so which node, each key lands on;
- runs a two-key Lua script (the Lesson 6 limiter shape) that fails with `CROSSSLOT`, then succeeds once both keys share a `{hash tag}`;
- runs `redis-cli` without `-c` to see a `MOVED` redirect, and with `-c` to see the client follow it.

The concept covers 16,384 hash slots, client-side routing, hash tags and the hot-shard risk they bring, Pub/Sub scope in a cluster, and when to move to Cluster vs when Sentinel is enough.

Writes the cluster and eviction half of reference sheet 4 (including `allkeys-lfu` for caches, `noeviction` for coordination data, and big/hot keys).

**Blocked by:** 08

**Status:** ready-for-agent

- [ ] One command starts the `cluster` profile, and `CLUSTER INFO` reports `cluster_state:ok` before labs run
- [ ] The untagged script throws `CROSSSLOT`; the tagged one succeeds; `--check` asserts both and is part of `labs:verify`
- [ ] The `MOVED` redirect is shown with real output
- [ ] The cluster and eviction half of sheet 4 is written; sheet 4 is complete
- [ ] The quiz includes at least one question about an earlier lesson
