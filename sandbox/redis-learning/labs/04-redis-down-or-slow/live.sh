#!/usr/bin/env bash
# Run only against the local course cluster. No product data is edited.
set -euo pipefail
: "${PRODUCT_ID:?Set PRODUCT_ID to an existing product ID from Lesson 1}"
: "${COOKIE_JAR:?Set COOKIE_JAR to the login cookie file from Lesson 1}"
[[ -f "$COOKIE_JAR" ]] || { echo 'Cookie file does not exist' >&2; exit 1; }
[[ "$PRODUCT_ID" =~ ^[[:xdigit:]]{24}$ ]] || { echo 'Expected a MongoDB ObjectId' >&2; exit 1; }
context=$(kubectl config current-context)
[[ "$context" == docker-desktop ]] || { echo 'This exercise requires the docker-desktop local context' >&2; exit 1; }
namespace=${NAMESPACE:-default}
base=${BASE_URL:-https://ecom.dev}
k() { kubectl --context "$context" --namespace "$namespace" "$@"; }
probe() {
  local label=$1 url=$2 require_ok=${3:-false} result code
  # A curl deadline bounds the experiment; it is NOT a server command timeout.
  code=0
  result=$(curl -gsk --max-time 10 -b "$COOKIE_JAR" -o /dev/null \
    -w 'HTTP %{http_code} · %{time_total}s' "$url") || code=$?
  printf '%s: %s · curl exit %s\n' "$label" "$result" "$code"
  if [[ "$require_ok" == true && ( "$code" != 0 || "$result" != HTTP\ 200* ) ]]; then
    echo 'Baseline failed. Check login, ingress and product ID before taking Redis down.' >&2
    return 1
  fi
}
k rollout status deployment/product-deployment --timeout=120s
k rollout status deployment/product-redis-deployment --timeout=120s
probe 'healthy detail' "$base/api/product/$PRODUCT_ID" true
probe 'healthy search' "$base/api/product?search=kindle" true
restored=false
restore() {
  if [[ "$restored" == false ]]; then
    echo 'Restoring product Redis to 1 replica...'
    k scale deployment product-redis-deployment --replicas=1 || return 1
    k rollout status deployment/product-redis-deployment --timeout=120s || return 1
    restored=true
  fi
}
# Install BEFORE scale-down. Normal exit, errors, Ctrl-C and TERM restore Redis.
# SIGKILL, terminal/host loss cannot run a trap: use the manual restore in the lesson.
trap restore EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
k scale deployment product-redis-deployment --replicas=0
k wait --for=delete pod -l app=product-redis --timeout=120s
probe 'Redis down detail' "$base/api/product/$PRODUCT_ID"
probe 'Redis down search' "$base/api/product?search=kindle"
restore
probe 'recovered detail' "$base/api/product/$PRODUCT_ID"
probe 'recovered search' "$base/api/product?search=kindle"
echo 'Record these timings and the Redis reconnect/error messages from product logs.'
