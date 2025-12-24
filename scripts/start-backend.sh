#!/bin/bash

# ============================================================
# Backend Port-Forward Script
# ============================================================
# Port-forwards backend services for local MFE development.
# Run this AFTER: skaffold dev
#
# Access:
#   - Auth:    http://localhost:3100/api/users
#   - Product: http://localhost:4100/api/product
#   - Cart:    http://localhost:4200/api/cart
# ============================================================

set -e

cleanup() {
    echo ""
    echo "🛑 Stopping port-forwards..."
    pkill -f "kubectl port-forward" 2>/dev/null || true
    exit 0
}

trap cleanup EXIT INT TERM

echo "🚀 Setting up backend port-forwards..."
echo ""
echo "⚠️  Make sure skaffold is running: skaffold dev"
echo ""

# Kill existing port-forwards
pkill -f "kubectl port-forward" 2>/dev/null || true
sleep 1

echo "🔗 Starting port-forwards..."

kubectl port-forward svc/auth-srv 3100:3000 &
kubectl port-forward svc/product-srv 4100:4000 &
kubectl port-forward svc/cart-srv 4200:4000 &
kubectl port-forward svc/order-srv 4300:4000 &
sleep 2

echo ""
echo "✅ Backend APIs ready!"
echo ""
echo "📍 API Endpoints:"
echo "   - Auth:    http://localhost:3100/api/users"
echo "   - Product: http://localhost:4100/api/product"
echo "   - Cart:    http://localhost:4200/api/cart"
echo "   - Order:   http://localhost:4300/api/order"
echo ""
echo "Press Ctrl+C to stop"
echo ""

wait

