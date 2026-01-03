# 📚 Chapter 7: Production Best Practices

## 🎯 Learning Objectives
By the end of this chapter, you will understand:
- How to deploy ETL services safely
- Kubernetes configurations for ETL workloads
- Security considerations
- Disaster recovery strategies
- Operational runbooks

---

## 🚀 Deployment Strategies

### Blue-Green Deployment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BLUE-GREEN DEPLOYMENT                             │
│                                                                      │
│   Current (Blue)                    New (Green)                     │
│   ┌──────────────┐                 ┌──────────────┐                 │
│   │ ETL v1.0     │                 │ ETL v1.1     │                 │
│   │ (Running)    │                 │ (Deploying)  │                 │
│   └──────────────┘                 └──────────────┘                 │
│          ▲                                                          │
│          │ Traffic                                                  │
│          │                                                          │
│   ┌──────────────────────────────────────────────────┐              │
│   │              Load Balancer / Ingress             │              │
│   └──────────────────────────────────────────────────┘              │
│                                                                      │
│   Steps:                                                            │
│   1. Deploy Green (v1.1) alongside Blue (v1.0)                     │
│   2. Test Green thoroughly                                          │
│   3. Switch traffic from Blue to Green                             │
│   4. Keep Blue running for quick rollback                          │
│   5. Decommission Blue after verification                          │
│                                                                      │
│   ✅ Zero downtime                                                  │
│   ✅ Easy rollback                                                  │
│   ⚠️ Requires 2x resources during transition                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Rolling Update (Kubernetes Default)

```yaml
# k8s/etl-depl.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: etl-depl
spec:
  replicas: 1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0    # Never have 0 pods
      maxSurge: 1          # Can temporarily have 1 extra
  template:
    spec:
      containers:
        - name: etl
          image: souravdeveloper/ecom-etl:latest
```

---

## ☸️ Kubernetes Configuration

### Resource Limits

```yaml
# Prevent ETL from consuming too many resources
containers:
  - name: etl
    resources:
      requests:
        memory: "256Mi"    # Guaranteed memory
        cpu: "100m"        # 0.1 CPU cores
      limits:
        memory: "512Mi"    # Max memory (OOM killed if exceeded)
        cpu: "500m"        # Max CPU (throttled if exceeded)
```

**Why Set Limits?**
```
┌─────────────────────────────────────────────────────────────────────┐
│               RESOURCE LIMITS IMPORTANCE                             │
│                                                                      │
│   Without limits:                                                   │
│   ├── ETL could consume all node memory                            │
│   ├── Other pods get evicted                                       │
│   ├── Node becomes unstable                                        │
│   └── ETL itself might get randomly killed                         │
│                                                                      │
│   With limits:                                                      │
│   ├── ETL stays within bounds                                      │
│   ├── Node remains healthy                                         │
│   ├── Predictable behavior                                         │
│   └── Kubernetes can schedule efficiently                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Health Probes

```yaml
containers:
  - name: etl
    livenessProbe:
      httpGet:
        path: /api/etl/live
        port: 4000
      initialDelaySeconds: 30    # Wait before first check
      periodSeconds: 10          # Check every 10 seconds
      failureThreshold: 3        # Restart after 3 failures
    
    readinessProbe:
      httpGet:
        path: /api/etl/ready
        port: 4000
      initialDelaySeconds: 10
      periodSeconds: 5
      failureThreshold: 3        # Remove from service after 3 failures
```

**Probe Differences:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                 LIVENESS vs READINESS                                │
│                                                                      │
│   LIVENESS: "Is the application alive?"                            │
│   ─────────────────────────────────────                             │
│   If fails → Kubernetes RESTARTS the pod                           │
│                                                                      │
│   Use for:                                                          │
│   ├── Detecting deadlocks                                          │
│   ├── Infinite loops                                                │
│   └── Unrecoverable states                                         │
│                                                                      │
│   Our implementation:                                               │
│   GET /api/etl/live → Always returns 200 if app is running        │
│                                                                      │
│   READINESS: "Can this pod handle traffic?"                        │
│   ─────────────────────────────────────────                         │
│   If fails → Kubernetes REMOVES from service (no traffic)          │
│              but does NOT restart                                   │
│                                                                      │
│   Use for:                                                          │
│   ├── Database connections not ready                               │
│   ├── Dependencies not available                                   │
│   └── Heavy processing in progress                                 │
│                                                                      │
│   Our implementation:                                               │
│   GET /api/etl/ready → Tests all database connections              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Pod Disruption Budget

```yaml
# Prevent all ETL pods from being evicted at once
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: etl-pdb
spec:
  minAvailable: 1    # At least 1 pod must stay running
  selector:
    matchLabels:
      app: etl
```

---

## 🔐 Security Best Practices

### 1. Secret Management

```yaml
# DON'T: Hardcode secrets
env:
  - name: MONGO_PASSWORD
    value: "my-secret-password"  # ❌ NEVER DO THIS!

# DO: Use Kubernetes Secrets
env:
  - name: MONGO_PASSWORD
    valueFrom:
      secretKeyRef:
        name: etl-secrets
        key: mongo-password    # ✅ Stored securely
```

### 2. Least Privilege Principle

```typescript
// ETL user should have MINIMAL database permissions
// Product MongoDB: READ ONLY
// Cart PostgreSQL: INSERT, UPDATE (no DELETE, no DROP)
// Order MongoDB: INSERT, UPDATE
```

### 3. Network Policies

```yaml
# Only allow ETL to talk to specific databases
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: etl-network-policy
spec:
  podSelector:
    matchLabels:
      app: etl
  policyTypes:
    - Egress
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: product-mongo
      ports:
        - port: 27017
    - to:
        - podSelector:
            matchLabels:
              app: cart-postgres
      ports:
        - port: 5432
```

### 4. API Authentication

```typescript
// All sync endpoints require authentication + admin role
router.post(
    '/api/etl/sync',
    requireAuth,           // Must be logged in
    restrictTo('admin'),   // Must have admin role
    async (req, res) => { ... }
);
```

---

## 🛡️ Disaster Recovery

### Scenario 1: Database Corruption

```
┌─────────────────────────────────────────────────────────────────────┐
│               DATABASE CORRUPTION RECOVERY                           │
│                                                                      │
│   Problem: Cart PostgreSQL data is corrupted                        │
│                                                                      │
│   Steps:                                                            │
│   1. STOP ETL scheduler immediately                                │
│      curl -X POST /api/etl/scheduler/stop                          │
│                                                                      │
│   2. Restore PostgreSQL from backup                                 │
│      pg_restore -d cart backup.dump                                │
│                                                                      │
│   3. Run full ETL sync                                             │
│      curl -X POST /api/etl/sync -d '{"batchSize": 500}'           │
│                                                                      │
│   4. Validate sync                                                  │
│      curl /api/etl/validate                                        │
│                                                                      │
│   5. Restart scheduler                                              │
│      curl -X POST /api/etl/scheduler/start                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Scenario 2: ETL Service Crashes

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ETL CRASH RECOVERY                                │
│                                                                      │
│   Problem: ETL pod crashed during sync                              │
│                                                                      │
│   Automatic Recovery:                                               │
│   ├── Kubernetes detects pod failure                               │
│   ├── Restarts pod automatically                                   │
│   ├── Pod reconnects to databases                                  │
│   └── Scheduler resumes at next interval                           │
│                                                                      │
│   Manual Steps (if needed):                                         │
│   1. Check pod logs                                                 │
│      kubectl logs -l app=etl --previous                            │
│                                                                      │
│   2. Verify databases are healthy                                   │
│      curl /api/etl/health                                          │
│                                                                      │
│   3. Run validation                                                 │
│      curl /api/etl/validate                                        │
│                                                                      │
│   4. Trigger manual sync if needed                                  │
│      curl -X POST /api/etl/sync                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Scenario 3: Network Partition

```
┌─────────────────────────────────────────────────────────────────────┐
│                 NETWORK PARTITION HANDLING                           │
│                                                                      │
│   Problem: ETL can't reach one of the databases                    │
│                                                                      │
│   Built-in Protection:                                              │
│   ├── Connection timeout prevents hanging                          │
│   ├── Errors are logged                                            │
│   ├── Sync fails gracefully                                        │
│   └── Next scheduled run will retry                                │
│                                                                      │
│   Monitoring:                                                       │
│   ├── Health check shows which DB is unreachable                   │
│   ├── Alert on consecutive sync failures                           │
│   └── Dashboard shows sync status                                  │
│                                                                      │
│   Response:                                                         │
│   ├── Investigate network issue                                    │
│   ├── Check database pod status                                    │
│   ├── Verify network policies                                      │
│   └── Sync will auto-recover when network restores                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Operational Runbook

### Daily Operations

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DAILY CHECKLIST                                   │
│                                                                      │
│   Morning Check:                                                    │
│   ☐ Verify ETL pods are running                                   │
│      kubectl get pods -l app=etl                                   │
│                                                                      │
│   ☐ Check scheduler status                                         │
│      curl /api/etl/scheduler/status                                │
│                                                                      │
│   ☐ Review sync stats                                              │
│      curl /api/etl/stats                                           │
│                                                                      │
│   ☐ Check for sync errors in logs                                  │
│      kubectl logs -l app=etl --since=24h | grep -i error          │
│                                                                      │
│   ☐ Validate data consistency                                      │
│      curl /api/etl/validate                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Weekly Maintenance

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WEEKLY MAINTENANCE                                │
│                                                                      │
│   ☐ Review sync metrics trends                                     │
│      - Is duration increasing? (May need optimization)             │
│      - Is error rate increasing? (May have data issues)            │
│                                                                      │
│   ☐ Check memory usage trends                                      │
│      - Memory leak detection                                       │
│                                                                      │
│   ☐ Validate backup procedures work                                │
│                                                                      │
│   ☐ Review and rotate logs                                         │
│                                                                      │
│   ☐ Update dependencies if security patches available             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Emergency Procedures

```
┌─────────────────────────────────────────────────────────────────────┐
│                 EMERGENCY: STOP ALL SYNCS                            │
│                                                                      │
│   Reason: Discovered data corruption, need to investigate          │
│                                                                      │
│   Steps:                                                            │
│   1. Disable scheduler                                              │
│      curl -X POST /api/etl/scheduler/stop                          │
│                                                                      │
│   2. Scale down to 0 pods (prevents any sync)                      │
│      kubectl scale deployment etl-depl --replicas=0               │
│                                                                      │
│   3. Investigate the issue                                          │
│                                                                      │
│   4. Fix the issue                                                  │
│                                                                      │
│   5. Scale back up                                                  │
│      kubectl scale deployment etl-depl --replicas=1               │
│                                                                      │
│   6. Run dry-run sync first                                        │
│      curl -X POST /api/etl/sync -d '{"dryRun": true}'             │
│                                                                      │
│   7. If safe, run actual sync                                      │
│      curl -X POST /api/etl/sync                                    │
│                                                                      │
│   8. Re-enable scheduler                                            │
│      curl -X POST /api/etl/scheduler/start                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Performance Tuning

### Database Optimization

```sql
-- PostgreSQL: Add indexes for ETL queries
CREATE INDEX idx_product_id ON product(id);
CREATE INDEX idx_cart_user_id ON cart(userId);
CREATE INDEX idx_cart_product_id ON cart(productId);

-- Analyze tables for query planner
ANALYZE product;
ANALYZE cart;
```

### Connection Pool Sizing

```typescript
// TypeORM connection pool
const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.CART_DB_URL,
    
    // Connection pool settings
    extra: {
        max: 10,              // Maximum connections
        min: 2,               // Minimum connections
        idleTimeoutMillis: 30000,  // Close idle connections after 30s
    },
});
```

### Batch Size Tuning

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BATCH SIZE GUIDELINES                             │
│                                                                      │
│   Data Volume    │ Recommended Batch │ Delay Between │              │
│   ─────────────────────────────────────────────────────              │
│   < 1,000        │ 100               │ 50ms          │              │
│   1K - 10K       │ 200               │ 100ms         │              │
│   10K - 100K     │ 500               │ 100ms         │              │
│   > 100K         │ 1000              │ 200ms         │              │
│                                                                      │
│   Tune based on:                                                    │
│   ├── Available memory                                             │
│   ├── Database connection limits                                   │
│   ├── Network bandwidth                                            │
│   └── Acceptable sync duration                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Continuous Improvement

### Metrics to Track Over Time

```
┌─────────────────────────────────────────────────────────────────────┐
│                 IMPROVEMENT METRICS                                  │
│                                                                      │
│   Track these weekly/monthly:                                       │
│                                                                      │
│   Performance:                                                      │
│   ├── Average sync duration                                        │
│   ├── P95/P99 sync duration                                        │
│   ├── Records synced per second                                    │
│   └── Database query times                                         │
│                                                                      │
│   Reliability:                                                      │
│   ├── Sync success rate                                            │
│   ├── Error frequency by type                                      │
│   ├── Time between failures                                        │
│   └── Recovery time                                                │
│                                                                      │
│   Data Quality:                                                     │
│   ├── Records out of sync before each run                         │
│   ├── Data validation errors                                       │
│   └── Orphaned records                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Key Takeaways

| Area | Best Practice |
|------|---------------|
| **Deployment** | Use rolling updates, blue-green for major changes |
| **Kubernetes** | Set resource limits, health probes, PDBs |
| **Security** | Secrets in K8s, least privilege, network policies |
| **Disaster Recovery** | Document procedures, practice recovery |
| **Operations** | Daily health checks, weekly maintenance |
| **Performance** | Tune batch size, indexes, connection pools |

---

## ➡️ Next Chapter
[Chapter 8: Quick Reference & Glossary](./08-quick-reference.md)

