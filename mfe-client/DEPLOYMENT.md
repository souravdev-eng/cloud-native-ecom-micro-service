# MFE Kubernetes Deployment Guide

This guide explains how to deploy the Micro Frontend (MFE) architecture to Kubernetes with minimal configuration.

## Quick Start

### 1. Build Docker Images

```bash
# Build all MFE images
docker build -t souravdeveloper/ecom-mfe-host ./host
docker build -t souravdeveloper/ecom-mfe-user ./user
docker build -t souravdeveloper/ecom-mfe-dashboard ./dashboard
docker build -t souravdeveloper/ecom-mfe-shared ./shared

# Push to registry (if using remote registry)
docker push souravdeveloper/ecom-mfe-host
docker push souravdeveloper/ecom-mfe-user
docker push souravdeveloper/ecom-mfe-dashboard
docker push souravdeveloper/ecom-mfe-shared
```

### 2. Deploy with Skaffold (Recommended)

```bash
# Development with hot reload
skaffold dev

# Production deployment
skaffold run
```

### 3. Manual Deployment

```bash
# Apply all MFE deployments
kubectl apply -f ../../k8s/mfe-host-depl.yml
kubectl apply -f ../../k8s/mfe-user-depl.yml
kubectl apply -f ../../k8s/mfe-dashboard-depl.yml
kubectl apply -f ../../k8s/mfe-shared-depl.yml

# Apply ingress (if not already applied)
kubectl apply -f ../../k8s/ingress-depl.yml
```

## Architecture Overview

### Services

- **mfe-host-srv**: Main shell application (Port 3000)
- **mfe-user-srv**: User authentication module (Port 3000)
- **mfe-dashboard-srv**: Admin dashboard module (Port 3000)
- **mfe-shared-srv**: Shared components library (Port 3000)

### Ingress Routes

- `ecom.dev` → mfe-host-srv (Main application)
- `mfe-user.ecom.dev` → mfe-user-srv (User module remoteEntry.js)
- `mfe-dashboard.ecom.dev` → mfe-dashboard-srv (Dashboard module remoteEntry.js)
- `mfe-shared.ecom.dev` → mfe-shared-srv (Shared module)
- `admin.ecom.dev` → mfe-host-srv (Admin access)

## Configuration

### Module Federation

The production configuration uses Kubernetes service URLs:

- **Host** (`host/module-federation.config.prod.ts`):
  - Consumes: `user@http://mfe-user.ecom.dev/remoteEntry.js`
  - Consumes: `dashboard@http://mfe-dashboard.ecom.dev/remoteEntry.js`

### Environment Variables

No environment variables are required for basic deployment. All configuration is done through:
- Module Federation config files
- Kubernetes ingress routing
- Nginx configuration

## Health Checks

All services include health checks:
- **Liveness Probe**: Checks every 10 seconds after 10s initial delay
- **Readiness Probe**: Checks every 5 seconds after 5s initial delay

## Resource Limits

Default resource allocation:
- **Host/User/Dashboard**: 128Mi-256Mi memory, 100m-200m CPU
- **Shared**: 64Mi-128Mi memory, 50m-100m CPU

## Troubleshooting

### Check Service Status

```bash
kubectl get deployments
kubectl get services
kubectl get pods
```

### View Logs

```bash
kubectl logs -f deployment/mfe-host-depl
kubectl logs -f deployment/mfe-user-depl
kubectl logs -f deployment/mfe-dashboard-depl
kubectl logs -f deployment/mfe-shared-depl
```

### Verify Ingress

```bash
kubectl get ingress
kubectl describe ingress ingress-service
```

### Test Remote Entry Points

```bash
# Test user module
curl http://mfe-user.ecom.dev/remoteEntry.js

# Test dashboard module
curl http://mfe-dashboard.ecom.dev/remoteEntry.js
```

### Common Issues

1. **Module Federation Loading Errors**
   - Verify all remote modules are accessible
   - Check ingress routing is correct
   - Ensure remoteEntry.js files are being served

2. **CORS Issues**
   - Verify nginx configs include proper headers
   - Check ingress annotations

3. **Port Mismatches**
   - All services use port 3000 in Kubernetes
   - Nginx configs listen on port 3000
   - Dockerfiles expose port 3000

## Scaling

To scale individual modules:

```bash
kubectl scale deployment/mfe-host-depl --replicas=3
kubectl scale deployment/mfe-user-depl --replicas=2
```

## Rollback

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/mfe-host-depl
kubectl rollout undo deployment/mfe-user-depl
kubectl rollout undo deployment/mfe-dashboard-depl
kubectl rollout undo deployment/mfe-shared-depl
```

