# 📚 Chapter 8: Quick Reference & Glossary

## 🎯 This Chapter Contains
- Cheat sheets for common operations
- API reference
- Glossary of terms
- Troubleshooting quick fixes
- Further learning resources

---

## 📋 ETL Cheat Sheet

### Start/Stop Commands

```bash
# Start ETL service (development)
cd etl-service && npm start

# Run manual sync via CLI
npm run sync

# Run dry-run sync
npm run sync -- --dry-run

# Run with custom batch size
npm run sync -- --batch-size=50
```

### API Quick Reference

```bash
# Trigger full sync
curl -X POST http://localhost:4000/api/etl/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<your-session>" \
  -d '{"dryRun": false, "batchSize": 100}'

# Sync only specific pipelines
curl -X POST http://localhost:4000/api/etl/sync \
  -d '{"pipelines": ["product"]}'  # Only product sync

curl -X POST http://localhost:4000/api/etl/sync \
  -d '{"pipelines": ["cart"]}'     # Only cart sync

# Check sync status
curl http://localhost:4000/api/etl/status

# Validate data consistency
curl http://localhost:4000/api/etl/validate

# Get statistics
curl http://localhost:4000/api/etl/stats

# Health check
curl http://localhost:4000/api/etl/health

# Scheduler control
curl http://localhost:4000/api/etl/scheduler/status
curl -X POST http://localhost:4000/api/etl/scheduler/start
curl -X POST http://localhost:4000/api/etl/scheduler/stop
```

### Docker Commands

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

# View logs
docker logs -f etl-service
```

### Kubernetes Commands

```bash
# Deploy
kubectl apply -f k8s/etl-depl.yml

# Check status
kubectl get pods -l app=etl
kubectl get deployment etl-depl

# View logs
kubectl logs -l app=etl
kubectl logs -l app=etl --previous  # Logs from crashed pod

# Restart
kubectl rollout restart deployment etl-depl

# Scale
kubectl scale deployment etl-depl --replicas=0  # Stop
kubectl scale deployment etl-depl --replicas=1  # Start

# Get shell access
kubectl exec -it <pod-name> -- /bin/sh
```

---

## 🔧 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PRODUCT_SERVICE_MONGODB_URL` | MongoDB URL for Product Service | - | ✅ |
| `ORDER_SERVICE_MONGODB_URL` | MongoDB URL for Order Service | Uses product URL | ❌ |
| `CART_DB_URL` | PostgreSQL URL for Cart Service | - | ✅ |
| `MONGO_USER` | MongoDB username | - | ✅ |
| `MONGO_PASSWORD` | MongoDB password | - | ✅ |
| `JWT_KEY` | JWT secret for authentication | - | ✅ |
| `PORT` | HTTP server port | `4000` | ❌ |
| `SYNC_CRON_SCHEDULE` | Cron schedule for product sync | `*/30 * * * *` | ❌ |
| `CART_SYNC_CRON_SCHEDULE` | Cron schedule for cart sync | `*/10 * * * *` | ❌ |
| `HEALTH_CHECK_CRON_SCHEDULE` | Cron for health checks | `*/5 * * * *` | ❌ |
| `ENABLE_SCHEDULER` | Enable/disable scheduler | `true` | ❌ |
| `SYNC_BATCH_SIZE` | Default batch size | `100` | ❌ |
| `CART_SYNC_BATCH_SIZE` | Cart sync batch size | `100` | ❌ |
| `TIMEZONE` | Timezone for cron jobs | `UTC` | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `DEBUG_ETL` | Enable debug logging | `false` | ❌ |

---

## 📊 API Response Formats

### Sync Response

```json
{
  "success": true,
  "message": "All ETL pipelines synced successfully",
  "results": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "dryRun": false,
    "productSync": {
      "totalProductsInSource": 1000,
      "totalProductsInTarget": 950,
      "missingProducts": 50,
      "syncedProducts": 50,
      "errors": [],
      "duration": 2500,
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "cartSync": {
      "totalCartsInSource": 500,
      "totalCartsInTarget": 480,
      "missingCarts": 20,
      "syncedCarts": 20,
      "updatedCarts": 5,
      "errors": [],
      "duration": 1200,
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Validation Response

```json
{
  "success": true,
  "isValid": false,
  "productSync": {
    "isValid": false,
    "details": {
      "sourceCount": 1000,
      "targetCount": 950,
      "missingInTarget": 50,
      "extraInTarget": 0,
      "missingProductIds": ["id1", "id2", "..."],
      "extraProductIds": []
    }
  },
  "cartSync": {
    "isValid": true,
    "details": {
      "sourceCount": 500,
      "targetCount": 500,
      "missingInTarget": 0,
      "extraInTarget": 0
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Health Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "etl-service",
  "version": "1.0.0",
  "uptime": 86400,
  "connections": {
    "productMongodb": true,
    "orderMongodb": true,
    "postgresql": true
  },
  "memory": {
    "used": 45.23,
    "total": 128.00
  }
}
```

---

## ⚡ Quick Troubleshooting

### Problem: Sync Takes Too Long

```bash
# 1. Check current batch size
curl /api/etl/scheduler/status

# 2. Try larger batch size
curl -X POST /api/etl/sync -d '{"batchSize": 500}'

# 3. Check for missing indexes
# PostgreSQL:
psql -c "EXPLAIN ANALYZE SELECT * FROM product WHERE id = 'test';"
```

### Problem: Out of Memory

```bash
# 1. Reduce batch size
curl -X POST /api/etl/sync -d '{"batchSize": 50}'

# 2. Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Problem: Connection Errors

```bash
# 1. Check health endpoint
curl /api/etl/health

# 2. Verify environment variables
kubectl exec <pod> -- env | grep -E 'MONGO|POSTGRES|CART'

# 3. Test database connectivity
kubectl exec <pod> -- nc -zv mongo-host 27017
kubectl exec <pod> -- nc -zv postgres-host 5432
```

### Problem: Scheduler Not Running

```bash
# 1. Check if enabled
curl /api/etl/scheduler/status

# 2. Check cron expression is valid
# Use: https://crontab.guru/

# 3. Restart the scheduler
curl -X POST /api/etl/scheduler/start
```

### Problem: Duplicates in Target

```bash
# 1. Check for unique constraint
psql -c "\d product"  # Look for unique constraint on id

# 2. Add unique constraint if missing
psql -c "ALTER TABLE product ADD CONSTRAINT unique_id UNIQUE (id);"

# 3. Remove duplicates first
psql -c "DELETE FROM product a USING product b 
         WHERE a.id = b.id AND a.ctid < b.ctid;"
```

---

## 📖 Glossary

| Term | Definition |
|------|------------|
| **ETL** | Extract, Transform, Load - process for moving data between systems |
| **Pipeline** | A complete ETL workflow from source to target |
| **Source** | The system data is extracted FROM |
| **Target** | The system data is loaded INTO |
| **Batch** | A group of records processed together |
| **Incremental sync** | Only sync what has changed/missing |
| **Full reload** | Delete and re-insert all data |
| **Dry run** | Test ETL without making changes |
| **Idempotent** | Can run multiple times with same result |
| **Eventual consistency** | Data will be consistent eventually, not immediately |
| **CAP Theorem** | Consistency, Availability, Partition tolerance trade-off |
| **Checkpoint** | Saved progress point for recovery |
| **Dead Letter Queue** | Queue for failed/problematic records |
| **Cron** | Time-based job scheduler |
| **UPSERT** | Insert or update if exists |
| **Cursor** | Database pointer for streaming results |
| **Connection pool** | Reusable set of database connections |

---

## 📚 Further Learning Resources

### ETL & Data Engineering

- 📕 **"Fundamentals of Data Engineering"** by Joe Reis & Matt Housley
- 📗 **"The Data Warehouse Toolkit"** by Ralph Kimball
- 🌐 [DataEngineering.wiki](https://dataengineering.wiki)

### Distributed Systems

- 📕 **"Designing Data-Intensive Applications"** by Martin Kleppmann (Must read!)
- 📗 **"Building Microservices"** by Sam Newman
- 🎥 [MIT Distributed Systems Course](https://pdos.csail.mit.edu/6.824/)

### Node.js & TypeScript

- 📕 **"Node.js Design Patterns"** by Mario Casciaro
- 🌐 [TypeORM Documentation](https://typeorm.io)
- 🌐 [Mongoose Documentation](https://mongoosejs.com)

### Kubernetes & DevOps

- 📕 **"Kubernetes in Action"** by Marko Lukša
- 📗 **"The DevOps Handbook"**
- 🌐 [Kubernetes Documentation](https://kubernetes.io/docs)

### Related Concepts

- 🌐 [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- 🌐 [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- 🌐 [Saga Pattern](https://microservices.io/patterns/data/saga.html)

---

## 🗺️ Documentation Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DOCUMENTATION STRUCTURE                           │
│                                                                      │
│   📁 docs/                                                          │
│   │                                                                 │
│   ├── 01-what-is-etl.md           ← Start here! Basics             │
│   │                                                                 │
│   ├── 02-etl-architecture.md      ← How our ETL is structured      │
│   │                                                                 │
│   ├── 03-design-decisions.md      ← WHY we made certain choices    │
│   │                                                                 │
│   ├── 04-scalability-patterns.md  ← Scaling to millions of records │
│   │                                                                 │
│   ├── 05-distributed-systems.md   ← Understanding microservices    │
│   │                                                                 │
│   ├── 06-testing-debugging.md     ← Testing & troubleshooting      │
│   │                                                                 │
│   ├── 07-production-best-practices.md ← Running in production      │
│   │                                                                 │
│   └── 08-quick-reference.md       ← You are here! Cheat sheets     │
│                                                                      │
│   Recommended reading order: 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✅ Learning Completion Checklist

```
After reading all chapters, you should be able to:

☐ Explain what ETL stands for and describe each phase
☐ Draw the architecture of the ETL service
☐ Explain why batch processing is used instead of one-by-one
☐ Describe the difference between incremental and full sync
☐ Explain why we use a Set for missing product identification
☐ Name 3 scalability patterns for ETL
☐ Explain what eventual consistency means
☐ Describe how ETL complements event-driven architecture
☐ Write a unit test for transformation logic
☐ Configure Kubernetes health probes for ETL
☐ Explain the difference between liveness and readiness probes
☐ Describe recovery steps for common failure scenarios
☐ Use the ETL API to trigger and monitor syncs
☐ Debug common ETL issues using logs and health checks
```

---

## 🎉 Congratulations!

You've completed the ETL Service learning guide! You now understand:

- ✅ **What ETL is** and why it's crucial for microservices
- ✅ **How to architect** an ETL service
- ✅ **Design decisions** and trade-offs
- ✅ **Scalability patterns** for growing data
- ✅ **Distributed systems** fundamentals
- ✅ **Testing and debugging** techniques
- ✅ **Production best practices**

**Next Steps:**
1. Try modifying the ETL service to add a new pipeline
2. Experiment with different batch sizes
3. Add new metrics or logging
4. Build a dashboard to visualize sync status

Happy coding! 🚀

