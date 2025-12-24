#!/bin/bash

# ============================================================
# MFE Local Development Script
# ============================================================
# Runs all MFE apps locally with hot reload.
# Backend services run in k8s via: skaffold dev -p backend
# 
# Prerequisites:
#   1. Run backend: skaffold dev -p backend
#   2. /etc/hosts entry: 127.0.0.1 ecom.local
#
# Usage:
#   ./scripts/start-dev.sh
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MFE_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$MFE_ROOT"

cleanup() {
    echo ""
    echo "🛑 Stopping MFE dev servers..."
    pkill -f "rspack serve" 2>/dev/null || true
    exit 0
}

trap cleanup EXIT INT TERM

echo "🚀 Starting MFE apps locally..."
echo ""
echo "⚠️  Make sure backend is running: skaffold dev -p backend"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
(cd "$MFE_ROOT/shared" && pnpm install --silent) &
(cd "$MFE_ROOT/host" && pnpm install --silent) &
(cd "$MFE_ROOT/user" && pnpm install --silent) &
(cd "$MFE_ROOT/dashboard" && pnpm install --silent) &
wait

echo ""
echo "🏃 Starting dev servers..."
echo ""

# Start shared first, then others
(cd "$MFE_ROOT/shared" && pnpm start) &
sleep 3
(cd "$MFE_ROOT/user" && pnpm start) &
(cd "$MFE_ROOT/dashboard" && pnpm start) &
sleep 2
(cd "$MFE_ROOT/host" && pnpm start) &

echo ""
echo "✅ MFE apps starting..."
echo ""
echo "📍 Access: http://localhost:3000"
echo "📍 API:    http://ecom.local/api/users"
echo ""
echo "Press Ctrl+C to stop"
echo ""

wait
