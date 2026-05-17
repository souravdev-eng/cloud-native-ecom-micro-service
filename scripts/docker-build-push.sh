#!/bin/bash

# ============================================================
# Docker Build & Push Script
# ============================================================
# Runs `npm run d-pub` (docker build + push) in each service.
#
# Usage:
#   ./scripts/docker-build-push.sh              # all services
#   ./scripts/docker-build-push.sh auth product  # specific services
# ============================================================

set -e

# service_name:directory pairs
ALL_SERVICES="auth:auth product:product cart:cart order:order notification:notification etl:etl-service"

get_dir() {
  for entry in $ALL_SERVICES; do
    if [ "${entry%%:*}" = "$1" ]; then
      echo "${entry#*:}"
      return 0
    fi
  done
  return 1
}

usage() {
  echo "Usage: $0 [service1 service2 ...]"
  echo ""
  echo "Available services: $(echo "$ALL_SERVICES" | tr ' ' '\n' | cut -d: -f1 | tr '\n' ' ')"
  echo "If no service is specified, all services are built and pushed."
  exit 1
}

# Determine which services to build
if [ $# -eq 0 ]; then
  TARGETS=$(echo "$ALL_SERVICES" | tr ' ' '\n' | cut -d: -f1)
else
  TARGETS=""
  for arg in "$@"; do
    if ! get_dir "$arg" > /dev/null; then
      echo "Error: unknown service '${arg}'"
      usage
    fi
    TARGETS="$TARGETS $arg"
  done
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Services: ${TARGETS}"

for svc in $TARGETS; do
  dir="$(get_dir "$svc")"
  echo ""
  echo "==> ${svc} (npm run d-pub in ${dir}/) ..."
  (cd "${ROOT_DIR}/${dir}" && npm run d-pub)
  echo "==> Done: ${svc}"
done

echo "Pulling Elastic Search Image"
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.11.0
echo "Elastic Search Image pulled successfully"

echo "Pulling Redis Image"
docker pull redis:alpine
echo "Redis Image pulled successfully"

echo ""
echo "All done!"
