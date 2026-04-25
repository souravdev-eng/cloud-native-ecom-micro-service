# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a polyrepo-style monorepo: each top-level directory is an independently-built service with its own `package.json` / `go.mod`, Dockerfile, and k8s deployment. There is no root-level package manager — run scripts from inside each service.

Backend services:
- `auth/` — Node+TS, MongoDB, JWT auth (entry `src/index.ts`)
- `product/` — Node+TS, MongoDB + Redis, advanced search/caching (entry `src/index.ts`)
- `cart/` — Node+TS, PostgreSQL via TypeORM (entry `src/index.ts`)
- `order/` — Node+TS, MongoDB + Stripe (entry `src/index.ts`)
- `notification/` — Node+TS, RabbitMQ consumer + Nodemailer (entry `src/server.ts`)
- `etl-service/` — Node+TS, Mongo↔Postgres sync, node-cron (entry `src/index.ts`)
- `review/` — Go + Gin, PostgreSQL (`cmd/`, `internal/handler|service|repository|model|middleware|config|router`, `pkg/`, `migrations/`)

Other:
- `common/` — published npm package `@ecom-micro/common` (errors, events, logger, middleware, queues, types) consumed by all Node services. Built to `common/build` and published to npm; services depend on it by version, not by workspace link.
- `mfe-client/` — Module Federation micro-frontend monorepo (pnpm workspace + Turborepo). Workspaces: `host` (3000), `user` (3001), `dashboard` (3002), `shared` (3003), `admin`. Built with Rspack + React 19.
- `k8s/` — manifests (`config/`, `secret/`, `volumes/`, per-service `*-depl.yml`, `ingress-depl.yml`)
- `skaffold.yaml` — orchestrates k8s dev with three profiles (see below)
- `sandbox/`, `doc/`, `static/`, `tools/`, `scripts/`

## Common commands

### Node backend services (auth, cart, order, product, notification, etl-service)
From inside the service directory:
```bash
npm start            # ts-node-dev --poll, hot reload
npm test             # jest --watchAll --no-cache (not present in order/)
npm run test:ci      # single-run jest (auth/cart/product only)
npm run d-build      # docker build -t souravdeveloper/ecom-<svc>
npm run d-pub        # build + docker push
```
Service-specific:
- `auth/`: `npm run build` (tsc)
- `product/`: `npm run seed` — `src/seeds/seedProducts.ts`
- `etl-service/`: `npm run sync` — `src/scripts/manualSync.ts`

Running a single Jest test (from the service dir):
```bash
npx jest path/to/file.test.ts -t "test name"
```

### `common` package
```bash
cd common
npm run build        # clean + tsc → build/
npm run pub          # commits, bumps patch, builds, publishes to npm
```
Services consume `@ecom-micro/common` by version (see each service's package.json). After changing `common/`, publish a new version and bump the dependency in each consumer — there is no workspace-linking.

### Review (Go)
Standard Go workflow from `review/`: `go run ./cmd`, `go test ./...`, migrations under `migrations/`.

### MFE client (pnpm + Turborepo)
From `mfe-client/`:
```bash
pnpm install
pnpm dev                    # turbo run dev — all MFEs
pnpm dev:host | dev:user | dev:dashboard | dev:admin
pnpm build | build:<app>
pnpm lint | lint:fix | format | type-check
```
MFEs run locally on ports 3000–3003; they are **not** deployed by the default skaffold profiles. Host consumes remotes `user` and `dashboard` via Module Federation (`module-federation.config.ts` for dev, `.prod.ts` for k8s URLs).

### Skaffold (local k8s dev)
```bash
skaffold dev              # profile: minimal (default, auto-activated on `dev`)
skaffold dev -p backend   # adds notification, order, etl
skaffold dev -p full      # everything including ELK stack
```
- `minimal`: auth, product, cart + Postgres, RabbitMQ, Redis, ingress
- Images built locally (no push); file sync on `src/**/*.ts` for hot reload
- Secrets/config must exist in `k8s/secret/` and `k8s/config/` before `skaffold dev`

## Architecture notes

**Shared foundation via `@ecom-micro/common`.** All Node services depend on this published package for cross-cutting concerns: error types, Express middleware (auth, error handling), RabbitMQ producer/consumer wrappers (`queues/`), typed event contracts (`events/`), and Winston + winston-elasticsearch logger. When adding a new event or error type, the change belongs in `common/src/`, must be published, and then consumed via version bump in each service.

**Event-driven communication over RabbitMQ.** Services are connected asynchronously through RabbitMQ (see `k8s/rabbitmq-depl.yml` and `amqplib` usage). Typical flows: Product events → Cart (inventory sync), Product events → Notification (alerts), Product events → Order (price updates), ETL subscribes to Mongo/Postgres writes for sync. Synchronous HTTP calls between services are avoided — add a new event type in `common/src/events/` instead.

**Per-service datastores, no shared DB.**
- Mongo (Atlas in prod): auth, product, order, etl source
- Postgres (RDS in prod): cart, review, etl target
- Redis: product caching only (cache keys are md5-hashed `product_search:<hash>` — see README caching section)

**Gateway + auth.** `ingress-depl.yml` (NGINX ingress) fronts all services. Auth is JWT via `cookie-session` + `jsonwebtoken`; middleware in `common/src/middleware/` (`requireAuth`, `currentUser`) is shared across services.

**Node service layout convention** (auth is canonical):
```
src/
  index.ts       # DB + queue connect, then listen
  app.ts         # Express app, middleware, route mounting
  config.ts      # env var loading
  controllers/   # route handlers
  service/       # business logic
  models/        # Mongoose / TypeORM entities
  validation/    # express-validator chains
  queue/         # RabbitMQ publishers/consumers (uses common)
  utils/
  test/setup.ts  # jest setup (mongodb-memory-server or pg-mem)
```
Order service currently has no tests (no `test` script, no `src/test`).

**Product service specifics.** Advanced query engine: MongoDB text indexes with weights, both offset and cursor pagination (`nextKey` base64-encoded), field projection via `?fields=`, multi-operator filters (`price[gte]`, etc.), tiered Redis TTLs by query type (search 3600s, category 600s, filtered 300s). When modifying product queries, preserve both pagination modes and the cache-key generator.

**MFE architecture.** Host shell (port 3000) dynamically loads `UserApp` and `dashboardApp` via Module Federation. `shared/` is consumed as a library, not federated. Turborepo caches builds; `pnpm` is required (packageManager pinned to `pnpm@8.15.0`).

**CI.** GitHub Actions workflows exist only for `auth`, `cart`, `product` (`.github/workflows/<svc>-ci.yml`). Other services have no CI gate.

## Gotchas

- `common` consumer versions drift — several services pin `^2.0.48` while `common/package.json` is at `2.0.51`. Check the declared version before relying on a newly-added export.
- Secrets in `k8s/secret/` are not gitignored templates; real values must be present locally for `skaffold dev` to succeed. `config.MD` shows sample `AUTH_DB_URL` / `PRODUCT_URL` format.
- `order/` has no jest config or tests — do not assume test scaffolding exists there.
- `mfe-client/README.md` references `npm run start:dev` and `dev:auth` which don't exist; the real scripts are `pnpm dev` and `pnpm dev:user` (defined in `mfe-client/package.json`).
- Services use Node's npm/ts-node-dev; the MFE monorepo uses pnpm. Don't cross-run.
