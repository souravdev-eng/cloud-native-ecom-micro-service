# Production-Readiness Curriculum — cloud-native-ecom-micro-service

## Context

This repo is a personal learning sandbox built to practice system design that doesn't come up in day-to-day work. Breadth is done: 6 backend services (Node+Go), RabbitMQ event bus, Module Federation MFE, k8s + Skaffold. The next phase is **depth**: take each service from "works on my machine" to "I could justify this in a production review." The goal isn't to ship to real users — it's to teach yourself what "production-ready" actually means by hitting every problem at least once, with enough repetition that it sticks.

Format: one service per cycle, roughly 10–14 evenings each depending on scope. Each cycle runs the same playbook so the *process* becomes automatic — after 3–4 cycles, you'll be auditing systems without needing the checklist. Cross-cutting themes (observability, reliability, security, testing, CI/CD) compound across services — by the time you finish cycle 9, patterns you learned in cycle 2 will have been applied 7 times.

Cadence note: this is evening work, not full-time. The phases below are ordered, not time-boxed — a cycle advances when the phase's exit criteria are met, not when a calendar day ends.

Intended outcome: a repo you can defend line-by-line in a senior+ system design interview, plus the mental muscle to spot production gaps on *any* codebase.

## The Cycle Playbook (runs identically for every service)

The cycle moves through six phases. Each phase has an **exit criterion** — move on only when it's met.

### Phase A — Audit (read-only)
Write findings to `doc/tracking/audit-<service>.md`. Check:
- Deps: CVEs (`npm audit` / `govulncheck`), version lag, unused
- Tests: coverage %, what paths are uncovered, integration vs unit ratio
- Runtime: graceful shutdown? health/readiness probes? resource limits?
- Observability: structured logs? metrics? traces? correlation IDs?
- Security: authz on every route, input validation, rate limits, secret handling
- Reliability: retries, timeouts, idempotency keys, DLQs, circuit breakers
- k8s: resource requests/limits, probes, HPA, PDB, service account
- CI: exists? what does it gate? image scan?
- Data: migrations versioned? backups? index coverage for hot queries?

**Exit:** audit doc exists with every finding tagged `#critical` / `#important` / `#backlog`.

### Phase B — Prioritize
Fix scope is determined by risk, not a fixed count:
- **Must fix this cycle:** everything tagged `#critical` — security holes, data-loss risks, credential exposure, auth bypasses
- **Should fix this cycle:** 1–3 `#important` items chosen for *learning value* (the things that teach you a pattern you haven't done before)
- **Defer:** everything else → append to `doc/tracking/backlog.md` with the service tag

Write one learning goal per chosen fix ("after this I should understand X").

**Exit:** prioritized list committed to the audit doc; backlog updated.

### Phase C — Implement fixes
- One fix = one commit, with a message that explains *why*, not *what*
- Pair each fix with a test that would have caught it
- No scope creep — backlog items stay in the backlog
- **Rollback rule:** if a fix introduces a regression caught after merge, revert first and re-audit. Don't patch-forward on a broken fix — you lose the learning and the history gets muddy.

**Exit:** all must-fix items merged; each has a test that fails against the pre-fix code.

### Phase D — Production essentials pass
- Add/verify: `/healthz` + `/readyz`, graceful SIGTERM, structured logs with request-id
- Add: Prometheus `/metrics` endpoint (even without a scraper yet — the endpoint is the contract)
- Add: k8s resource requests/limits, liveness+readiness probes wired correctly
- Add: GitHub Actions workflow (build, test, image scan, SBOM)
- **Defer to Cycle 9:** OpenTelemetry tracing, log aggregation, Grafana dashboards — these need platform infrastructure that doesn't exist yet. Exposing `/metrics` now is cheap; consuming it can wait.

**Exit:** service passes checklist items 3–5 of the Verification section below.

### Phase E — Measure
- **Early cycles (1–3):** basic load test with `hey` or `autocannon` against the main endpoint; record requests/sec + p50/p95. Don't chase detailed latency analysis without Grafana.
- **Later cycles (4–8):** k6 scenario in `<service>/loadtest/` with realistic mixed workload
- **Cycle 9 onwards:** full dashboards + historical comparison
- Failure injection: kill a dependency (RabbitMQ, DB) — document the observed behavior. Does the service degrade gracefully? Does it recover?

**Exit:** baseline numbers recorded in audit doc; failure-injection outcome documented.

### Phase F — Writeup
Create `doc/tracking/postmortem-<service>.md`:
- What was broken, what I fixed, what I measured, what I'd do next
- One paragraph on "what I learned that I didn't know before"
- Update root `CLAUDE.md` if architecture invariants changed
- Update the progress tracker in this doc

**Exit:** postmortem committed; tracker updated.

## Service Order & Rationale

**Cycle 0 — Foundation** — not a service, but prerequisite. Larger scope than a single service cycle; budget ~2 weeks of evenings and split into two sub-cycles if needed.

*0a — Secrets & credentials (must do first, blocks everything):*
- Rotate the Mongo Atlas credentials referenced in `config.MD` and `k8s/secret/*` (exposed in git history; rotate in Atlas, don't just delete from repo)
- Decide: history rewrite (filter-repo/BFG) or leave history and rely on rotation? Document the decision.
- Establish `.env.example` + gitignored `.env` pattern across all services
- Pick a secrets tool for k8s (sealed-secrets vs SOPS vs just documented manual apply) — start with the simplest that forces secrets out of the repo

*0b — Repo hygiene:*
- Align all `@ecom-micro/common` consumers on one version; add a CI check that fails on drift
- Add a root `Makefile` or `justfile` so commands are discoverable across services
- Add `doc/tracking/backlog.md` skeleton so later cycles have somewhere to append

**Exit for Cycle 0:** no real credentials in the repo; one-command discoverability from repo root; common versions aligned.

Why first: everything else depends on this being clean. Audits in later cycles will keep surfacing "secrets hygiene" findings until this is done.

**Cycle 1 — `auth`**
- Why first service: every request passes through it; fixing it here propagates trust
- Focus: JWT rotation, refresh tokens, rate-limiting login, bcrypt cost tuning, session fixation, password reset token TTL, account lockout

**Cycle 2 — `product`**
- Why second: most business logic surface area → best learning density
- Focus: Redis cache stampede protection, index verification with `explain()`, cursor pagination edge cases, S3 upload security (signed URLs, MIME validation), search query DoS limits

**Cycle 3 — `cart`**
- Why: Postgres/TypeORM gives a different failure model than Mongo
- Focus: transaction boundaries, optimistic locking for inventory, connection pool sizing, N+1 queries, migration safety (zero-downtime column adds)

**Cycle 4 — `order`**
- Why: no tests today + Stripe + highest blast radius if broken
- Focus: idempotency keys on payment intents, webhook signature verification, saga/outbox pattern for order→payment→inventory, retry with exponential backoff, reconciliation job

**Cycle 5 — `notification`**
- Why: pure event consumer — teaches RabbitMQ patterns deeply
- Focus: DLQ + redrive, poison message handling, consumer prefetch tuning, at-least-once vs exactly-once, template injection hardening, email rate limits

**Cycle 6 — `etl-service`**
- Why: data consistency is the hardest distributed-systems topic; tackle it after you've seen the source/sink services
- Focus: CDC vs polling trade-off, watermarks, backfill strategy, schema evolution, idempotent upserts, monitoring lag

**Cycle 7 — `review` (Go)**
- Why: language switch keeps Go muscle alive; Go idioms for production differ from Node
- Focus: `context.Context` propagation, `sql.DB` pool tuning, structured errors with `errors.Is/As`, graceful shutdown with `signal.NotifyContext`, `pprof` endpoints, goroutine leak detection

**Cycle 8 — `mfe-client`**
- Why: frontend production concerns are distinct (bundle size, CDN, runtime errors)
- Focus: Module Federation version pinning, CSP headers, Sentry/error tracking, Lighthouse budgets, preload/prefetch strategy, SSR vs CSR decision

**Cycle 9 — Platform pass (2 weeks)**
- Why: by now each service is solid; now wire them together properly
- Focus: Prometheus + Grafana deployment, OpenTelemetry collector, Jaeger/Tempo, Loki for logs, HPA with custom metrics, NetworkPolicies, PodDisruptionBudgets, ingress TLS (cert-manager), `kubectl top` baselines

## Cross-Cutting Tracks (woven into every cycle)

| Track | What "production-ready" means per service |
|---|---|
| **Observability** | Structured logs w/ request-id → Prometheus `/metrics` → OTel traces propagated via RabbitMQ headers |
| **Security** | No route without authz; all input validated; rate limits on public endpoints; deps scanned weekly; secrets never in env dumps |
| **Reliability** | Timeouts on every I/O; retries with jitter; graceful shutdown drains in-flight work; idempotency where writes can duplicate |
| **Testing** | ≥70% unit coverage on service/ layer; integration tests hit a real container DB (testcontainers); one k6 load scenario per service |
| **CI/CD** | Per-service workflow: lint → typecheck → test → build → scan → push; failing workflow blocks merge |

Pick one track to emphasize per cycle so depth accumulates instead of everything being shallow. Suggested emphasis: C0=security, C1=security, C2=observability, C3=reliability, C4=reliability, C5=reliability, C6=testing, C7=observability, C8=testing, C9=all.

## Critical files per cycle (reference, not exhaustive)

- Audit output: `doc/tracking/audit-<service>.md` (new, per cycle)
- Postmortem: `doc/tracking/postmortem-<service>.md` (new, per cycle)
- Rolling backlog: `doc/tracking/backlog.md` (new, append-only)
- Service source: `<service>/src/` (Node) or `review/internal/` (Go)
- k8s manifest: `k8s/<service>-depl.yml`
- CI: `.github/workflows/<service>-ci.yml` (create where missing — currently only auth/cart/product)
- Shared: `common/src/` — only touch when the fix belongs here *and* bump version + update all consumers

## Reuse / existing utilities to lean on

- `common/src/middleware/` — shared auth middleware; don't reimplement per service
- `common/src/queues/` — RabbitMQ wrappers; new event types go through `common/src/events/`
- `common/src/logger/` — Winston + winston-elasticsearch already wired; extend this, don't add a second logger
- `common/src/errors/` — typed errors with HTTP mapping; every new error should be a subclass here

## Verification (how you know a cycle is done)

A cycle is "done" only when **all** of these are true:
1. `doc/tracking/audit-<service>.md` exists and lists every finding (tagged `#critical` / `#important` / `#backlog`)
2. Every `#critical` finding is fixed; chosen `#important` fixes merged; each has a test that fails against the pre-fix code
3. Service has `/healthz`, `/readyz`, `/metrics`, structured logs with request-id
4. k8s manifest has resource requests/limits + both probes pointing at real endpoints
5. CI workflow runs on PR and blocks merge on failure
6. Baseline load-test numbers recorded in audit doc (`hey`/`autocannon` for early cycles; k6 scenario under `<service>/loadtest/` from cycle 4 onward)
7. Failure-injection outcome documented: "when X dies, service does Y, recovers in Z"
8. `doc/tracking/postmortem-<service>.md` exists with the "what I learned" paragraph
9. Root `CLAUDE.md` updated if any invariant changed; progress tracker in this doc updated

If you can't tick all 9, the cycle extends rather than moves on. No half-finished services — partially-fixed code is worse than untouched code because you lose track of what's trustworthy.

**Rollback rule:** if a regression from this cycle surfaces after the postmortem, revert the offending commit, re-open the cycle, and add the missed case to the audit doc. The learning is in the miss, not in the hot-patch.

## How we'll work together per cycle

1. You say "start cycle N on <service>" — I run Phase A (audit) and produce `doc/tracking/audit-<service>.md`
2. We review findings together in Phase B; you confirm the `#critical` list and pick `#important` items by learning value
3. Phase C: I implement one fix at a time; you review each commit before the next
4. Phase D runs as a checklist pass; Phase E I help design the load test and interpret results
5. Phase F writeup is yours to draft, I edit

Cadence target: one cycle per 10–14 evenings. If life gets busy, pause *between* cycles — never mid-cycle. A paused mid-cycle service has an incomplete audit and half-applied fixes; a paused-between-cycles service is just "next up."

## Explicit non-goals

- No rewrites. Every cycle is incremental. If a service needs a rewrite, that's a separate decision, not a cycle outcome.
- No chasing new tech. Stick with the current stack (Node/TS, Go, Mongo, Postgres, Redis, RabbitMQ, k8s). The learning is in *depth*, not *novelty*.
- No real users, no real payments, no real uptime SLO. This is a lab. Keep the README honest about that.
- No adding services until all 9 cycles are done. Breadth is frozen; depth is the game.

## Progress tracker

| Cycle | Target | Status | Audit | Postmortem |
|---|---|---|---|---|
| 0 | Foundation | ⬜ not started | — | — |
| 1 | auth | ⬜ | — | — |
| 2 | product | ⬜ | — | — |
| 3 | cart | ⬜ | — | — |
| 4 | order | ⬜ | — | — |
| 5 | notification | ⬜ | — | — |
| 6 | etl-service | ⬜ | — | — |
| 7 | review (Go) | ⬜ | — | — |
| 8 | mfe-client | ⬜ | — | — |
| 9 | Platform pass | ⬜ | — | — |
