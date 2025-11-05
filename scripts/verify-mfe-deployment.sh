#!/bin/bash

# Verification script for MFE deployment
# This script checks if all MFE services are running and accessible

set -e

echo "🔍 Verifying MFE deployment..."

# Function to check if a URL is accessible
check_endpoint() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -n "🔄 Checking $name ($url)... "
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --connect-timeout 5 "$url" > /dev/null 2>&1; then
            echo "✅ OK"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            echo "❌ FAILED (after $max_attempts attempts)"
            return 1
        fi
        
        sleep 2
        ((attempt++))
    done
}

# Function to check Kubernetes deployment status
check_k8s_deployment() {
    local deployment=$1
    local name=$2
    
    echo -n "🔄 Checking Kubernetes deployment $name... "
    
    if kubectl get deployment "$deployment" > /dev/null 2>&1; then
        local ready=$(kubectl get deployment "$deployment" -o jsonpath='{.status.readyReplicas}')
        local desired=$(kubectl get deployment "$deployment" -o jsonpath='{.spec.replicas}')
        
        if [ "$ready" = "$desired" ] && [ "$ready" != "0" ]; then
            echo "✅ OK ($ready/$desired pods ready)"
            return 0
        else
            echo "⚠️  Not ready ($ready/$desired pods ready)"
            return 1
        fi
    else
        echo "❌ Deployment not found"
        return 1
    fi
}

echo ""
echo "📋 Checking Kubernetes deployments..."

# Check Kubernetes deployments
check_k8s_deployment "mfe-host-depl" "MFE Host"
check_k8s_deployment "mfe-user-depl" "MFE User"
check_k8s_deployment "mfe-dashboard-depl" "MFE Dashboard"
check_k8s_deployment "mfe-shared-depl" "MFE Shared"

echo ""
echo "🌐 Checking HTTP endpoints..."

# Check HTTP endpoints
check_endpoint "http://ecom.dev" "Main App (Host)"
check_endpoint "http://admin.ecom.dev" "Admin Dashboard"
check_endpoint "http://mfe-user.ecom.dev" "User Module"
check_endpoint "http://mfe-dashboard.ecom.dev" "Dashboard Module"
check_endpoint "http://mfe-shared.ecom.dev" "Shared Module"

echo ""
echo "🔍 Checking Module Federation remote entries..."

# Check remote entry files
check_endpoint "http://mfe-user.ecom.dev/remoteEntry.js" "User Remote Entry"
check_endpoint "http://mfe-dashboard.ecom.dev/remoteEntry.js" "Dashboard Remote Entry"

echo ""
echo "📊 Deployment Summary:"
echo "======================"

# Get pod information
echo "🟢 Running Pods:"
kubectl get pods -l app=mfe-host -o wide --no-headers 2>/dev/null | head -5 || echo "   No MFE Host pods found"
kubectl get pods -l app=mfe-user -o wide --no-headers 2>/dev/null | head -5 || echo "   No MFE User pods found"
kubectl get pods -l app=mfe-dashboard -o wide --no-headers 2>/dev/null | head -5 || echo "   No MFE Dashboard pods found"
kubectl get pods -l app=mfe-shared -o wide --no-headers 2>/dev/null | head -5 || echo "   No MFE Shared pods found"

echo ""
echo "🌍 Available URLs:"
echo "   🏠 Main App:           http://ecom.dev"
echo "   👨‍💼 Admin Dashboard:    http://admin.ecom.dev"
echo "   👤 User Module:        http://mfe-user.ecom.dev"
echo "   📊 Dashboard Module:   http://mfe-dashboard.ecom.dev"
echo "   🔧 Shared Module:      http://mfe-shared.ecom.dev"

echo ""
echo "🎉 Verification complete!"

# Check if ingress controller is running
echo ""
echo "🔍 Checking NGINX Ingress Controller..."
if kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller --no-headers 2>/dev/null | grep -q "Running"; then
    echo "✅ NGINX Ingress Controller is running"
else
    echo "⚠️  NGINX Ingress Controller not found or not running"
    echo "   Run: kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml"
fi

echo ""
echo "📝 Troubleshooting:"
echo "   - If endpoints are not accessible, check if hosts are added to /etc/hosts"
echo "   - Run './scripts/setup-mfe-hosts.sh' to setup hosts"
echo "   - Check pod logs: kubectl logs -f deployment/mfe-host-depl"
echo "   - Check ingress: kubectl describe ingress ingress-service"
