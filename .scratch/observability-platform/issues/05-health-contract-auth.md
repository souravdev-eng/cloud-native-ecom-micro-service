# 05: Health contract: `/healthz` + `/readyz` in `auth` with k8s probes

**Parent spec:** `../spec.md`

**What to build:** Kubernetes can tell whether `auth` is alive and whether it's ready to serve. Common gains a **health routes factory** that accepts named dependency checks:
- `/healthz` returns 200 whenever the process is up and runs no dependency checks;
- `/readyz` runs every check with a timeout and returns 200 with per-check status when all pass, or 503 with per-check status when any fails or times out.

`auth` mounts it with a MongoDB check (plus RabbitMQ if it holds a connection). Its deployment gets liveness and readiness probes on those endpoints.

**Blocked by:** 01 (common test harness)

**Status:** ready-for-agent

- [ ] Common tests: `/healthz` returns 200 without running checks
- [ ] Common tests: `/readyz` returns 200 with all checks listed as ok; returns 503 naming the failed check when one throws; returns 503 when a check exceeds the timeout
- [ ] New common version published; `auth` bumped and mounts health routes
- [ ] `auth` gains a smoke test: `/healthz` returns 200
- [ ] `auth` deployment has liveness → `/healthz` and readiness → `/readyz`; a pod with Mongo unreachable goes NotReady but isn't restarted
