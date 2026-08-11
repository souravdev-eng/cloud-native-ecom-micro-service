#!/bin/bash

# ============================================================
# CREATE THE K8S SECRET FROM ROOT .env  (generic)
# ============================================================
# There is exactly ONE secret for the whole platform: "ecom-secret"
# (see k8s/secret/ecom-secret.example.yml for the full key list).
# This script builds it from the repo-root .env (gitignored) so the
# values never have to live in a manifest on disk.
#
# Usage:
#   ./scripts/create-secret.sh ecom              # the platform secret
#   ./scripts/create-secret.sh ecom KEY=ENV_VAR  # ad-hoc override/extra
#
# Alternative: kubectl apply -f k8s/secret/ecom-secret.yml
#
# Behavior:
#   - Secret name defaults to "ecom-secret" for target "ecom",
#     otherwise "<target>-secret"  (override with SECRET_NAME=...)
#   - Namespace defaults to "default"          (override with NAMESPACE=...)
#   - Mappings come from CLI args if given, else the registry() below.
#   - Idempotent, but a FULL REPLACE: keys absent from .env are dropped
#     from the secret. Keep every key below present in .env, or use the
#     manifest path instead.
# ============================================================

set -euo pipefail

# ------------------------------------------------------------
# Mapping registry:  <k8s-secret-key>:<var-in-root-.env>
# ------------------------------------------------------------
registry() {
  case "$1" in
    ecom)
      # Auth
      echo "JWT_KEY:JWT_KEY"
      # MongoDB (auth, product, review)
      echo "MONGO_USER:MONGO_USER"
      echo "MONGO_PASSWORD:MONGO_PASSWORD"
      echo "AUTH_SERVICE_MONGODB_URL:AUTH_DB"
      echo "PRODUCT_SERVICE_MONGODB_URL:PRODUCT_SERVICE_MONGODB_URL"
      echo "REVIEW_MONGODB_URL:REVIEW_MONGODB_URL"
      # PostgreSQL
      echo "POSTGRES_PASSWORD:POSTGRES_PASSWORD"
      echo "CART_DB_URL:CART_DB_URL"
      echo "ORDER_DB_URL:ORDER_POSTGRESQL_DB_URL"
      # Email (auth, notification)
      echo "EMAIL_USER:EMAIL_USER"
      echo "EMAIL_APP_PASSWORD:EMAIL_APP_PASSWORD"
      # Payments (order)
      echo "STRIPE_SECRET_KEY:STRIPE_SECRET_KEY"
      ;;
    *)
      return 0
      ;;
  esac
}

# ------------------------------------------------------------
SERVICE="${1:-}"
if [ -z "$SERVICE" ]; then
  echo "Usage: $0 ecom [KEY=ENV_VAR ...]"
  exit 1
fi
shift || true

if [ "$SERVICE" = "ecom" ]; then
  SECRET_NAME="${SECRET_NAME:-ecom-secret}"
else
  SECRET_NAME="${SECRET_NAME:-${SERVICE}-secret}"
fi
NAMESPACE="${NAMESPACE:-default}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Root .env not found at: $ENV_FILE"
  exit 1
fi
if ! command -v kubectl >/dev/null 2>&1; then
  echo "❌ kubectl not found on PATH"
  exit 1
fi

# Collect mappings: CLI args (KEY=ENV_VAR) override the registry.
MAPPINGS=()
if [ "$#" -gt 0 ]; then
  for arg in "$@"; do
    # accept KEY=ENV_VAR and store as KEY:ENV_VAR
    MAPPINGS+=("${arg%%=*}:${arg#*=}")
  done
else
  while IFS= read -r line; do
    [ -n "$line" ] && MAPPINGS+=("$line")
  done < <(registry "$SERVICE")
fi

if [ ${#MAPPINGS[@]} -eq 0 ]; then
  echo "❌ No mappings for '$SERVICE'. Add a case in registry() or pass KEY=ENV_VAR args."
  exit 1
fi

# Extract a value for a key from the .env file.
# Handles optional spaces around '=' and surrounding single/double quotes.
get_env() {
  local key="$1" line val
  line="$(grep -E "^[[:space:]]*${key}[[:space:]]*=" "$ENV_FILE" | head -n1 || true)"
  [ -z "$line" ] && return 1
  val="${line#*=}"
  val="$(printf '%s' "$val" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  val="${val%\"}"; val="${val#\"}"; val="${val%\'}"; val="${val#\'}"
  printf '%s' "$val"
}

echo "🔐 Building '$SECRET_NAME' (namespace: $NAMESPACE) from $ENV_FILE ..."

LITERAL_ARGS=()
for map in "${MAPPINGS[@]}"; do
  secret_key="${map%%:*}"
  env_var="${map##*:}"
  if value="$(get_env "$env_var")" && [ -n "$value" ]; then
    LITERAL_ARGS+=("--from-literal=${secret_key}=${value}")
    echo "   ✓ ${secret_key}  (from ${env_var})"
  else
    echo "   ⚠️  skipped ${secret_key}: '${env_var}' missing/empty in .env"
  fi
done

if [ ${#LITERAL_ARGS[@]} -eq 0 ]; then
  echo "❌ No values found — nothing to create."
  exit 1
fi

# Idempotent apply (create-or-update).
kubectl create secret generic "$SECRET_NAME" \
  --namespace "$NAMESPACE" \
  "${LITERAL_ARGS[@]}" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secret '$SECRET_NAME' is ready in namespace '$NAMESPACE'."
