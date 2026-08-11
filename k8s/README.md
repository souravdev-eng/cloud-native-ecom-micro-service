# Kubernetes Configuration

Configuration is centralized into **two files**:

| File | Object | Contents |
| --- | --- | --- |
| `k8s/config/app-config.yml` | ConfigMap `ecom-config` | non-secret, cluster-wide env (RabbitMQ, Redis, Elasticsearch, `NODE_ENV`) — **committed** |
| `k8s/secret/ecom-secret.yml` | Secret `ecom-secret` | all credentials (JWT, Mongo, Postgres, email, Stripe) — **gitignored** |

Every service consumes both the same way:

```yaml
envFrom:
  - configMapRef:
      name: ecom-config
  - secretRef:
      name: ecom-secret
```

There are no per-service ConfigMaps or Secrets. Add a key to the shared object
rather than creating a new one. A value used by exactly one service and never
shared (e.g. the ETL cron schedules) stays inline in that service's `*-depl.yml`.

## Setting up the secret

`k8s/secret/` is gitignored except for the template. Pick one of two paths:

**a) Manifest** — copy the template and fill in real values:

```bash
cp k8s/secret/ecom-secret.example.yml k8s/secret/ecom-secret.yml
$EDITOR k8s/secret/ecom-secret.yml
kubectl apply -f k8s/secret/ecom-secret.yml
```

`stringData` takes plain text — Kubernetes base64-encodes it. Do not pre-encode.

**b) From the root `.env`** — no plaintext manifest on disk:

```bash
./scripts/create-secret.sh ecom
```

The script maps root-`.env` variables to secret keys (see `registry()` in the
script). It is a **full replace**: any key missing from `.env` is dropped from
the secret, so keep all of them present or use path (a).

> Gmail needs an [App Password](https://support.google.com/accounts/answer/185833),
> not your account password.

## Verifying

```bash
kubectl get configmap ecom-config -o yaml
kubectl get secret ecom-secret -o jsonpath='{.data}' | jq 'keys'
```

## Key-name conventions

Because one Secret is injected into every pod, keys must be globally unique —
no two services may want a different value under the same name:

- Mongo URLs are per-service: `AUTH_SERVICE_MONGODB_URL`, `PRODUCT_SERVICE_MONGODB_URL`, `REVIEW_MONGODB_URL`
- Postgres URLs are per-service: `CART_DB_URL`, `ORDER_DB_URL`
- Where a service insists on a generic name, map it in its deployment. Order
  reads `DB_URL`, so `order-depl.yml` does:

  ```yaml
  env:
    - name: DB_URL
      valueFrom:
        secretKeyRef:
          name: ecom-secret
          key: ORDER_DB_URL
  ```

## Objects that intentionally stay separate

These are not duplicates of the two shared files:

- `k8s/elasticsearch-index-config.yml` — a JSON index-settings document, not
  env vars.

## Applying everything

Skaffold applies the ConfigMap for you; the secret is applied once per fresh
cluster:

```bash
kubectl apply -f k8s/secret/ecom-secret.yml   # or ./scripts/create-secret.sh ecom
skaffold dev                                  # minimal profile
```
