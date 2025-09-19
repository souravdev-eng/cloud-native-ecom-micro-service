#!/bin/bash

# Setup script for MFE local development with Kubernetes
# This script sets up the necessary host entries for local development

set -e

echo "🚀 Setting up MFE hosts for local Kubernetes development..."

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    HOSTS_FILE="/etc/hosts"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    HOSTS_FILE="/etc/hosts"
else
    echo "❌ Unsupported OS. This script supports macOS and Linux only."
    exit 1
fi

# Function to add host entry if it doesn't exist
add_host_entry() {
    local host=$1
    local ip=$2
    
    if ! grep -q "$host" "$HOSTS_FILE"; then
        echo "➕ Adding $host to hosts file..."
        echo "$ip $host" | sudo tee -a "$HOSTS_FILE" > /dev/null
    else
        echo "✅ $host already exists in hosts file"
    fi
}

# Add host entries for local development
add_host_entry "ecom.local" "127.0.0.1"
add_host_entry "admin.ecom.local" "127.0.0.1"
add_host_entry "mfe-user.ecom.local" "127.0.0.1"
add_host_entry "mfe-dashboard.ecom.local" "127.0.0.1"
add_host_entry "mfe-shared.ecom.local" "127.0.0.1"
add_host_entry "kibana.ecom.local" "127.0.0.1"

echo ""
echo "🎉 Host setup complete!"
echo ""
echo "📋 Available endpoints after deployment:"
echo "   🏠 Main App (Host):      http://ecom.local"
echo "   👨‍💼 Admin Dashboard:      http://admin.ecom.local"
echo "   👤 User Module:          http://mfe-user.ecom.local"
echo "   📊 Dashboard Module:     http://mfe-dashboard.ecom.local"
echo "   🔧 Shared Module:        http://mfe-shared.ecom.local"
echo "   📈 Kibana:               http://kibana.ecom.local"
echo ""
echo "🚀 Next steps:"
echo "   1. Make sure you have kubectl and skaffold installed"
echo "   2. Make sure your Kubernetes cluster is running (minikube/kind/docker-desktop)"
echo "   3. Enable NGINX Ingress Controller:"
echo "      kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml"
echo "   4. Run: skaffold dev"
echo ""
