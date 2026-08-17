# Micro Frontend (MFE) Application

This directory contains the Micro Frontend application built with Module Federation using Rspack. The application consists of multiple independent applications that work together to create a seamless user experience.

## Architecture

### Applications Overview

1. **Host** (`/host`) - Port 3000
   - Main shell application that orchestrates other micro frontends
   - Handles routing and overall application layout
   - Consumes remote modules from User, Dashboard, and Admin apps

2. **User** (`/user`) - Port 3001
   - User management and authentication UI
   - Exposes `UserApp` module
   - Built with React, Material-UI, and Tailwind CSS

3. **Dashboard** (`/dashboard`) - Port 3002
   - Storefront: products, search, cart
   - Exposes `dashboardApp` module
   - Built with React and Material-UI

4. **Shared** (`/shared`) - Port 3003
   - Common components and utilities
   - Shared configurations and types
   - Consumed as a **library**, not federated

5. **Admin** (`/admin`) - Port 3004
   - Admin console (products, users)
   - Exposes `adminApp` module

### `dev.config.json` — one file, every port

`mfe-client/dev.config.json` is the **single source of truth** for local dev. It
declares each MFE's port and each backend's `kubectl port-forward` mapping, and
it is read by both:

- `scripts/dev.mjs` — decides which tunnels to open and which apps to start
- every `<app>/rspack.config.ts` — `devServer.port`, `output.publicPath`, and the
  `__API_ENDPOINTS__` values inlined into the bundle

To move a port, edit `dev.config.json` and nothing else. **Never hardcode a URL
or port in `src/`** — read it from the injected `__API_ENDPOINTS__` (see
`<app>/src/api/baseUrl.ts`).

> **Why it's built this way**, and how the config changes for production:
> [`doc/engineering/mfe/local-dev-and-config-strategy.md`](../doc/engineering/mfe/local-dev-and-config-strategy.md)

| Local port | What                                     |
| ---------- | ---------------------------------------- |
| 3000       | host (shell)                             |
| 3001       | user                                     |
| 3002       | dashboard                                |
| 3003       | shared (library)                         |
| 3004       | admin                                    |
| 3100       | → `auth-srv:3000` (port-forward)         |
| 3200       | → `review-service:3000` (optional)       |
| 4100       | → `product-srv:4000` (port-forward)      |
| 4200       | → `cart-srv:4000` (port-forward)         |
| 4300       | → `order-srv:4000` (optional)            |
| 4400       | → `etl-srv:4000` (optional)              |

Run `pnpm dev:help` to print this table from the config itself.

## Technology Stack

- **Build Tool**: Rspack with Module Federation
- **Frontend Framework**: React 19.1.1
- **Styling**: Tailwind CSS, Material-UI, Emotion
- **TypeScript**: Full TypeScript support
- **Container**: Docker with Nginx for production
- **Orchestration**: Kubernetes with Skaffold for development

## Development

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Docker
- Kubernetes cluster (minikube, kind, or Docker Desktop)
- kubectl
- Skaffold

### Local Development Setup

The MFEs are **not deployed to k8s** — they run on your machine and talk to the
backend pods through `kubectl port-forward`. One command does all of it.

1. **Start the backends in the cluster** (from the repo root):

   ```bash
   skaffold dev -p backend
   ```

2. **Start the MFEs** (from `mfe-client/`):

   ```bash
   pnpm dev
   ```

   That single command:
   1. checks kubectl has a reachable context and the namespace exists
   2. runs `pnpm install`
   3. opens a `kubectl port-forward` per backend service — supervised, and
      **restarted automatically** if a tunnel drops
   4. waits until each tunnel actually accepts TCP
   5. starts every MFE dev server via Turborepo
   6. prints the URLs, and tears **everything** down on a single Ctrl+C

   Open http://localhost:3000.

3. **Useful variations:**

   ```bash
   pnpm dev:help                       # every flag + the port table
   pnpm dev --only=shared,user,host    # subset of MFEs
   pnpm dev:forward                    # tunnels only, no dev servers
   pnpm dev:offline                    # dev servers only (tunnels already open)
   pnpm dev --no-install               # skip pnpm install
   pnpm dev --namespace=ecom-dev       # non-default namespace
   ```

   Shorthands: `pnpm dev:user`, `pnpm dev:dashboard`, `pnpm dev:admin` each start
   `shared` + that MFE + `host`.

   Already have your own tunnels open? `pnpm dev` detects a port that is already
   in use and reuses it instead of failing.

4. **Pointing at something other than the port-forwards** — env vars override
   `dev.config.json` without editing it:

   ```bash
   MFE_AUTH_URL=https://auth.staging.internal pnpm dev   # one service
   MFE_API_HOST=192.168.1.20 pnpm dev                    # all of them, different host
   ```

`pnpm dev:turbo` is the raw `turbo run dev` with no tunnels or preflight — only
useful when debugging the script itself.

### Production Build

Each application can be built for production:

```bash
# Build all applications
cd host && pnpm run build
cd ../user && pnpm run build
cd ../dashboard && pnpm run build
cd ../shared && pnpm run build
```

## Kubernetes

**The MFEs are dev-only today — there are no `k8s/mfe-*-depl.yml` manifests and
no skaffold profile deploys them.** Only the backend services run in the cluster;
the browser reaches them through the port-forwards that `pnpm dev` opens.

### Backend prerequisites

1. **NGINX Ingress Controller** (only needed for the `ecom.dev` ingress path, not
   for port-forwarded dev):

   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
   ```

2. **Start the backends** — from the repo root:

   ```bash
   skaffold dev              # minimal: auth, product, cart + infra
   skaffold dev -p backend   # adds notification, order, etl
   skaffold dev -p full      # everything including ELK
   ```

### If/when the MFEs do get deployed

Two things must line up, both already centralised in `dev.config.json`:

- `production.apiBaseUrl` must equal the `host:` in `k8s/ingress-depl.yml`
  (currently `ecom.dev`)
- `production.remoteUrlPattern` needs matching ingress paths — the default
  `http://ecom.dev/mfe/{name}/remoteEntry.js` expects `/mfe/*` routes that
  `k8s/ingress-depl.yml` does **not** define yet

## Module Federation Configuration

### Development vs Production

Remote URLs and API base URLs are **derived from `dev.config.json`** by
`config/dev-config.cjs`, keyed off `NODE_ENV`:

| | Remotes | API base URLs |
| --- | --- | --- |
| dev | `http://localhost:<port>/remoteEntry.js` | one port-forward per service |
| prod | `production.remoteUrlPattern` | `production.apiBaseUrl` (the ingress) |

The host therefore has **one** `module-federation.config.ts` covering both modes.
The remotes (`user`, `dashboard`, `admin`) still keep a `.prod.ts` variant, since
theirs differ only in `shared` dependency settings, not URLs.

### Remote Modules

The Host application consumes `UserApp`, `dashboardApp`, and `adminApp`. Add or
remove a remote by adding an app with `"role": "remote"` to `dev.config.json` —
the host picks it up automatically.

## Docker Images

Each application has its own optimized Docker image:

- `souravdeveloper/ecom-mfe-host`
- `souravdeveloper/ecom-mfe-user`
- `souravdeveloper/ecom-mfe-dashboard`
- `souravdeveloper/ecom-mfe-shared`

### Building Docker Images

```bash
# Build individual images
docker build -t souravdeveloper/ecom-mfe-host ./host
docker build -t souravdeveloper/ecom-mfe-user ./user
docker build -t souravdeveloper/ecom-mfe-dashboard ./dashboard
docker build -t souravdeveloper/ecom-mfe-shared ./shared
```

## Monitoring and Debugging

### Dev server health

Each dev server answers on its own port — `pnpm dev` polls exactly these before
printing `READY`:

- Host: http://localhost:3000/
- User: http://localhost:3001/
- Dashboard: http://localhost:3002/
- Shared: http://localhost:3003/
- Admin: http://localhost:3004/

### Logs

MFE logs are prefixed per-process in the `pnpm dev` output (`turbo`, `fwd:auth`,
`fwd:cart`, …). Backend logs come from the cluster:

```bash
kubectl logs -f deployment/auth-deployment
kubectl logs -f deployment/product-deployment
kubectl logs -f deployment/cart-deployment
```

## Troubleshooting

### Common Issues

1. **Module Federation Loading Issues**
   - Ensure all remote applications are running and accessible
   - Check network connectivity between services
   - Verify remoteEntry.js files are accessible

2. **API calls fail / `ERR_CONNECTION_REFUSED` on a 3100/4100/4200 port**
   - A port-forward dropped. `pnpm dev` restarts them automatically and logs
     `! CART forward exited — restarting`; if it gives up after 10 tries the pod
     is probably crash-looping — check `kubectl get pods`.
   - `pnpm dev` refuses to start if a **required** service (auth, product, cart)
     is missing from the cluster. Start `skaffold dev -p backend` first.

3. **`port 4200 already in use`**
   - A stale forward from a previous run. `pnpm dev` reuses it rather than
     failing; if it points somewhere wrong, kill it:
     `lsof -nP -iTCP:4200 -sTCP:LISTEN -t | xargs kill`

4. **CORS Issues**
   - Backends must allow the MFE origins (`http://localhost:3000-3004`) and
     `credentials`, since every axios client uses `withCredentials: true`.

5. **Build Issues**
   - Clear node_modules and reinstall dependencies
   - Ensure all TypeScript types are properly exported
   - `__API_ENDPOINTS__ is not defined` means the app's `rspack.config.ts` is
     missing `new rspack.DefinePlugin(devConfig.defineEntries())`

### Development Tips

- Use browser dev tools to inspect Module Federation loading
- Check the Network tab for failed remote module requests
- Use React Developer Tools to debug component loading

## Contributing

1. Follow the existing code structure and patterns
2. Ensure TypeScript types are properly defined
3. Test both development and production builds
4. Update documentation for any new features or changes
5. Ensure all applications build and deploy successfully with Skaffold
