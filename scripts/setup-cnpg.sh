#!/bin/bash

# ============================================================
# CloudNativePG Operator Setup (one-time)
# ============================================================
# Installs the CNPG operator CRDs and controller into the cluster.
# Run this ONCE before using CNPG cluster manifests.
#
# Usage: ./scripts/setup-cnpg.sh
# ============================================================

set -e

CNPG_VERSION="1.25.1"
CNPG_URL="https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.25/releases/cnpg-${CNPG_VERSION}.yaml"

echo "==> Installing CloudNativePG operator v${CNPG_VERSION}..."
kubectl apply --server-side -f "${CNPG_URL}"

echo ""
echo "==> Waiting for CNPG operator to be ready..."
kubectl wait --for=condition=Available deployment/cnpg-controller-manager \
  -n cnpg-system --timeout=120s

echo ""
echo "==> CloudNativePG operator installed successfully!"
echo "    You can now deploy CNPG clusters via: skaffold dev -p full"
