# Micro Frontend (MFE) Application

This directory contains the Micro Frontend application built with Module Federation using Rspack. The application consists of multiple independent applications that work together to create a seamless user experience.

## Architecture

### Applications Overview

1. **Host** (`/host`) - Port 3000
   - Main shell application that orchestrates other micro frontends
   - Handles routing and overall application layout
   - Consumes remote modules from User and Dashboard apps

2. **User** (`/user`) - Port 3001
   - User management and authentication UI
   - Exposes `UserApp` module
   - Built with React, Material-UI, and Tailwind CSS

3. **Dashboard** (`/dashboard`) - Port 3002
   - Admin dashboard and analytics
   - Exposes `dashboardApp` module
   - Built with React and Material-UI

4. **Shared** (`/shared`) - Port 3003
   - Common components and utilities
   - Shared configurations and types
   - Reusable UI components

## Technology Stack

- **Build Tool**: Rspack with Module Federation
- **Frontend Framework**: React 19.1.1
- **Styling**: Tailwind CSS, Material-UI, Emotion
- **TypeScript**: Full TypeScript support
- **Container**: Docker with Nginx for production
- **Orchestration**: Kubernetes with Skaffold for development

## Development

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Docker
- Kubernetes cluster (minikube, kind, or Docker Desktop)
- kubectl
- Skaffold

### Local Development Setup

1. **Install dependencies for all applications:**

   ```bash
   cd mfe-client
   pnpm install
   ```

2. **Start all applications in development mode:**

   ```bash
   npm run start:dev
   ```

   This will start:
   - Host app on http://localhost:3000
   - User app on http://localhost:3001
   - Dashboard app on http://localhost:3002

3. **Or start individual applications:**

   ```bash
   # Host application
   npm run dev:host

   # User application
   npm run dev:auth

   # Dashboard application
   npm run dev:dashboard
   ```

### Production Build

Each application can be built for production:

```bash
# Build all applications
cd host && pnpm run build
cd ../user && pnpm run build
cd ../dashboard && pnpm run build
cd ../shared && pnpm run build
```

## Kubernetes Deployment

### Prerequisites Setup

1. **Setup host entries for local development:**

   ```bash
   ./scripts/setup-mfe-hosts.sh
   ```

2. **Enable NGINX Ingress Controller:**
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
   ```

### Deploy with Skaffold

1. **Development deployment with hot reload:**

   ```bash
   skaffold dev
   ```

2. **Production deployment:**
   ```bash
   skaffold run
   ```

### Manual Deployment

If you prefer to deploy manually:

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/mfe-host-depl.yml
kubectl apply -f k8s/mfe-user-depl.yml
kubectl apply -f k8s/mfe-dashboard-depl.yml
kubectl apply -f k8s/mfe-shared-depl.yml
kubectl apply -f k8s/ingress-depl.yml
```

## Available Endpoints

After deployment, the following endpoints will be available:

- **Main Application**: http://ecom.dev
- **Admin Dashboard**: http://admin.ecom.dev
- **User Module**: http://mfe-user.ecom.dev
- **Dashboard Module**: http://mfe-dashboard.ecom.dev
- **Shared Module**: http://mfe-shared.ecom.dev

## Module Federation Configuration

### Development vs Production

The applications use different Module Federation configurations:

- **Development**: Uses localhost URLs for remote modules
- **Production**: Uses Kubernetes service URLs for remote modules

Configuration files:

- `module-federation.config.ts` - Development configuration
- `module-federation.config.prod.ts` - Production configuration

### Remote Modules

The Host application consumes:

- `user@http://mfe-user.ecom.dev/remoteEntry.js` (UserApp)
- `dashboard@http://mfe-dashboard.ecom.dev/remoteEntry.js` (dashboardApp)

## Docker Images

Each application has its own optimized Docker image:

- `souravdeveloper/ecom-mfe-host`
- `souravdeveloper/ecom-mfe-user`
- `souravdeveloper/ecom-mfe-dashboard`
- `souravdeveloper/ecom-mfe-shared`

### Building Docker Images

```bash
# Build individual images
docker build -t souravdeveloper/ecom-mfe-host ./host
docker build -t souravdeveloper/ecom-mfe-user ./user
docker build -t souravdeveloper/ecom-mfe-dashboard ./dashboard
docker build -t souravdeveloper/ecom-mfe-shared ./shared
```

## Monitoring and Debugging

### Health Checks

All applications include health check endpoints:

- Host: http://localhost:3000/
- User: http://localhost:3001/
- Dashboard: http://localhost:3002/
- Shared: http://localhost:3003/

### Logs

View application logs in Kubernetes:

```bash
# View logs for specific deployment
kubectl logs -f deployment/mfe-host-depl
kubectl logs -f deployment/mfe-user-depl
kubectl logs -f deployment/mfe-dashboard-depl
kubectl logs -f deployment/mfe-shared-depl
```

## Troubleshooting

### Common Issues

1. **Module Federation Loading Issues**
   - Ensure all remote applications are running and accessible
   - Check network connectivity between services
   - Verify remoteEntry.js files are accessible

2. **CORS Issues**
   - Ensure proper CORS configuration in nginx
   - Check ingress controller settings

3. **Build Issues**
   - Clear node_modules and reinstall dependencies
   - Ensure all TypeScript types are properly exported

### Development Tips

- Use browser dev tools to inspect Module Federation loading
- Check the Network tab for failed remote module requests
- Use React Developer Tools to debug component loading

## Contributing

1. Follow the existing code structure and patterns
2. Ensure TypeScript types are properly defined
3. Test both development and production builds
4. Update documentation for any new features or changes
5. Ensure all applications build and deploy successfully with Skaffold
