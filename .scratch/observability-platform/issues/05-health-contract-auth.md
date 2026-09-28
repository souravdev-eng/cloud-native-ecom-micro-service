# 05: Health contract: `/healthz` + `/readyz` in `auth` with k8s probes

**Parent spec:** `../spec.md`

**What to build:** Kubernetes can tell whether `auth` is alive and whether it's ready to serve. Common gains a **health routes factory** that accepts named dependency checks:
- `/healthz` returns 200 whenever the process is up and runs no dependency checks;
- `/readyz` runs every check with a timeout and returns 200 with per-check status when all pass, or 503 with per-check status when any fails or times out.

`auth` mounts it with a MongoDB check (plus RabbitMQ if it holds a connection). Its deployment gets liveness and readiness probes on those endpoints.

**Blocked by:** 01 (common test harness)

**Status:** ready-for-agent

- [x] Common tests: `/healthz` returns 200 without running checks
- [x] Common tests: `/readyz` returns 200 with all checks listed as ok; returns 503 naming the failed check when one throws; returns 503 when a check exceeds the timeout
- [x] New common version published; `auth` bumped and mounts health routes
- [x] `auth` gains a smoke test: `/healthz` returns 200
- [ ] `auth` deployment has liveness → `/healthz` and readiness → `/readyz`; a pod with Mongo unreachable goes NotReady but isn't restarted

## Comments

- Implementation is complete and reviewed; user approved publication and commit. Live Kubernetes verification remains pending.
- 2026-09-28: Implemented `createHealthRoutes` in common 2.4.2 and published it to npm. Auth mounts MongoDB ping and RabbitMQ built-in-exchange checks before authentication. Checks have independent 1000 ms deadlines; exceptions are reported by status without exposing their messages.
- 2026-09-28: Reviewed readability cleanup published as common 2.4.3; auth's dependency and pnpm lockfile updated to consume that release.
- Validation: common's full suite (9 suites, 57 tests), auth's full suite (5 suites, 9 tests), both typechecks, common build, and auth deployment YAML/probe checks passed. Standards and Spec reviews found no issues.
- Runtime verification with a real in-memory MongoDB server and simulated RabbitMQ boundary: `/readyz` returned 200 while connected, then 503 naming MongoDB after disconnect; `/healthz` remained 200 in the same process.
- Kubernetes probe configuration is complete, but live NotReady/restart verification remains unchecked: the local Docker Desktop Kubernetes API at `127.0.0.1:6443` refused connections. Once available, deploy auth, record its pod's restart count, make MongoDB unreachable, and confirm readiness fails while liveness succeeds and the restart count stays unchanged. Restore MongoDB and confirm the pod becomes Ready again.
