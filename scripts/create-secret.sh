#!/bin/bash

# ============================================================
# CREATE A SERVICE K8S SECRET FROM ROOT .env  (generic)
# ============================================================
# Reads sensitive values from the repo-root .env (gitignored)
# and creates/updates a Kubernetes secret for a given service.
# Values never live in a committed manifest.
#
# Usage:
#   ./scripts/create-secret.sh <service> [KEY=ENV_VAR ...]
#
# Examples:
#   ./scripts/create-secret.sh order
#   ./scripts/create-secret.sh auth
#   # ad-hoc, without touching the registry below:
#   ./scripts/create-secret.sh order DB_URL=ORDER_POSTGRESQL_DB_URL
#
# Behavior:
#   - Secret name defaults to "<service>-secret" (override with SECRET_NAME=...)
#   - Namespace defaults to "default"           (override with NAMESPACE=...)
#   - Mappings come from CLI args if given, else the registry() below.
#   - Idempotent: re-running just updates the secret.
# ============================================================

set -euo pipefail

# ------------------------------------------------------------
# Per-service mapping registry:  <k8s-secret-key>:<var-in-root-.env>
# Add a case per service as you onboard them.
# ------------------------------------------------------------
registry() {
  case "$1" in
    order)
      echo "DB_URL:ORDER_POSTGRESQL_DB_URL"
      ;;
    auth)
      echo "AUTH_DB:AUTH_DB"
      echo "MONGO_USER:MONGO_USER"
      echo "MONGO_PASSWORD:MONGO_PASSWORD"
      ;;
    cart)
      echo "DB_URL:AUTH_POSTGRESQL_DB_URL"
      ;;
    *)
      return 0
      ;;
  esac
}

# ------------------------------------------------------------
SERVICE="${1:-}"
if [ -z "$SERVICE" ]; then
  echo "Usage: $0 <service> [KEY=ENV_VAR ...]"
  exit 1
fi
shift || true

SECRET_NAME="${SECRET_NAME:-${SERVICE}-secret}"
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
