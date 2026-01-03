# ETL Service

A dedicated microservice for synchronizing product data between the Product Service (MongoDB) and Cart Service (PostgreSQL) in the e-commerce microservices architecture.

## Overview

The ETL service addresses the classic data synchronization problem that occurs when RabbitMQ events are lost due to service downtime. It ensures that product data remains consistent across services by:

- Comparing products between Product Service and Cart Service databases
- Identifying missing products in the Cart Service
- Syncing missing products in configurable batches
- Providing both manual and scheduled synchronization options

## Features

### Core Functionality

- **Full Data Comparison**: Compares all products between source and target databases
- **Batch Processing**: Efficiently syncs products in configurable batch sizes
- **Dry Run Mode**: Test synchronization without making changes
- **Progress Tracking**: Real-time progress reporting during sync operations

### API Endpoints

- `POST /api/etl/sync` - Trigger manual synchronization
- `GET /api/etl/status` - Get sync status and validation results
- `GET /api/etl/validate` - Validate database synchronization
- `GET /api/etl/stats` - Get database statistics
- `GET /api/etl/health` - Health check endpoint
- `GET /api/etl/ready` - Readiness probe for Kubernetes
- `GET /api/etl/live` - Liveness probe for Kubernetes

### Scheduler System

- **Cron-based Scheduling**: Configurable automatic sync intervals
- **Health Monitoring**: Periodic health checks
- **Manual Control**: Start/stop scheduler via API
- **Environment Configuration**: Flexible scheduling via environment variables

## Configuration

### Environment Variables

| Variable                      | Description                                | Default        |
| ----------------------------- | ------------------------------------------ | -------------- |
| `PRODUCT_SERVICE_MONGODB_URL` | MongoDB connection URL for Product Service | Required       |
| `CART_DB_URL`                 | PostgreSQL connection URL for Cart Service | Required       |
| `MONGO_USER`                  | MongoDB username                           | Required       |
| `MONGO_PASSWORD`              | MongoDB password                           | Required       |
| `JWT_KEY`                     | JWT secret key                             | Required       |
| `SYNC_CRON_SCHEDULE`          | Cron schedule for automatic sync           | `*/30 * * * *` |
| `HEALTH_CHECK_CRON_SCHEDULE`  | Cron schedule for health checks            | `*/5 * * * *`  |
| `ENABLE_SCHEDULER`            | Enable/disable automatic scheduling        | `true`         |
| `SYNC_BATCH_SIZE`             | Number of products to sync per batch       | `100`          |
| `TIMEZONE`                    | Timezone for cron jobs                     | `UTC`          |
| `NODE_ENV`                    | Environment mode                           | `development`  |

## Usage

### Manual Synchronization

#### Via API

```bash
# Trigger sync
curl -X POST http://localhost:4000/api/etl/sync \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false, "batchSize": 100}'

# Check status
curl http://localhost:4000/api/etl/status
```

#### Via CLI Script

```bash
# Run sync
npm run sync

# Dry run
npm run sync -- --dry-run

# Custom batch size
npm run sync -- --batch-size=50
```

### Scheduled Synchronization

The service automatically runs synchronization based on the configured cron schedule. Default is every 30 minutes.

### Docker Deployment

```bash
# Build image
docker build -t souravdeveloper/ecom-etl .

# Run container
docker run -d \
  --name etl-service \
  -p 4000:4000 \
  -e PRODUCT_SERVICE_MONGODB_URL=mongodb://mongo:27017/product \
  -e CART_DB_URL=postgresql://postgres:password@postgres:5432/cart \
  -e MONGO_USER=admin \
  -e MONGO_PASSWORD=password \
  -e JWT_KEY=your-jwt-secret \
  souravdeveloper/ecom-etl
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/etl-depl.yml

# Check status
kubectl get pods -l app=etl
kubectl logs -l app=etl
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test
```

### Testing

The service includes comprehensive tests for:

- Core synchronization logic
- API endpoints
- Error handling
- Database operations

### Architecture

```
┌─────────────────┐    ┌─────────────────┐
│  Product Service │    │   Cart Service  │
│    (MongoDB)     │    │  (PostgreSQL)   │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          │                      │
          └──────┬─────────┬─────┘
                 │         │
         ┌───────▼─────────▼───────┐
         │     ETL Service           │
         │  ┌─────────────────┐    |
         │  │ Sync Algorithm  │      │
         │  └─────────────────┘    │
         │  ┌─────────────────┐    │
         │  │   Scheduler     │    │
         │  └─────────────────┘    │
         │  ┌─────────────────┐    │
         │  │   API Routes    │    │
         │  └─────────────────┘    │
         └─────────────────────────┘
```

## Monitoring

### Health Checks

- `/api/etl/health` - Overall service health
- `/api/etl/ready` - Database connectivity check
- `/api/etl/live` - Service liveness

### Logging

The service provides structured logging for:

- Sync operations and results
- Scheduler activities
- Database operations
- Error conditions

### Metrics

Key metrics tracked:

- Sync duration
- Products synced per operation
- Error rates
- Database connection status

## Troubleshooting

### Common Issues

1. **Database Connection Errors**

   - Verify connection strings and credentials
   - Check network connectivity
   - Ensure databases are running

2. **Sync Failures**

   - Check logs for specific error messages
   - Verify data integrity in source database
   - Try smaller batch sizes

3. **Scheduler Not Running**
   - Check `ENABLE_SCHEDULER` environment variable
   - Verify cron schedule format
   - Check service logs for initialization errors

### Debug Mode

Set `NODE_ENV=development` for detailed logging and debugging information.

## Contributing

1. Follow the existing code structure and patterns
2. Add tests for new functionality
3. Update documentation for configuration changes
4. Ensure Docker and Kubernetes configs are updated
