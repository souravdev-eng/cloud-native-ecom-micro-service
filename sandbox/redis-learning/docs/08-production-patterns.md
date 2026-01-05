# 📚 Chapter 8: Production Best Practices

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

- Redis high availability options
- Monitoring and alerting
- Memory management
- Security best practices

---

## 1️⃣ Redis Deployment Options

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REDIS DEPLOYMENT OPTIONS                                  │
│                                                                              │
│   1. STANDALONE                       2. SENTINEL (HA)                      │
│   ────────────────                    ────────────────                      │
│   ┌───────────┐                      ┌───────────┐                          │
│   │   Redis   │                      │  Sentinel │ (monitors)               │
│   │  (single) │                      └─────┬─────┘                          │
│   └───────────┘                            │                                │
│   ✅ Simple                          ┌─────┴─────┐                          │
│   ❌ No failover                     ▼           ▼                          │
│                               ┌───────────┐ ┌───────────┐                   │
│                               │  Master   │ │  Replica  │                   │
│                               └───────────┘ └───────────┘                   │
│                               ✅ Auto failover                              │
│                               ✅ Read replicas                              │
│                                                                              │
│   3. CLUSTER (Scale + HA)                                                   │
│   ───────────────────────                                                   │
│   ┌─────┐ ┌─────┐ ┌─────┐                                                  │
│   │ M1  │ │ M2  │ │ M3  │  (masters)                                       │
│   └──┬──┘ └──┬──┘ └──┬──┘                                                  │
│      │       │       │                                                      │
│   ┌──┴──┐ ┌──┴──┐ ┌──┴──┐                                                  │
│   │ R1  │ │ R2  │ │ R3  │  (replicas)                                      │
│   └─────┘ └─────┘ └─────┘                                                  │
│   ✅ Horizontal scaling (sharding)                                          │
│   ✅ High availability                                                       │
│   ⚠️ More complex                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Kubernetes Redis Setup

### Simple Redis for Development

```yaml
# k8s/product-redis-depl.yml (your current setup)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-redis-depl
spec:
  replicas: 1
  selector:
    matchLabels:
      app: product-redis
  template:
    metadata:
      labels:
        app: product-redis
    spec:
      containers:
        - name: product-redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "200m"
          args:
            - redis-server
            - --appendonly yes
            - --maxmemory 200mb
            - --maxmemory-policy allkeys-lru
          volumeMounts:
            - name: redis-data
              mountPath: /data
      volumes:
        - name: redis-data
          persistentVolumeClaim:
            claimName: redis-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: product-redis-srv
spec:
  selector:
    app: product-redis
  ports:
    - port: 6379
      targetPort: 6379
```

### Production Redis with Sentinel (Helm)

```bash
# Install Redis with Sentinel using Bitnami Helm chart
helm install redis-ha bitnami/redis \
  --set architecture=replication \
  --set sentinel.enabled=true \
  --set sentinel.masterSet=mymaster \
  --set replica.replicaCount=3 \
  --set auth.password=your-secure-password
```

---

## 3️⃣ Connection Management

### Connection Pool Configuration

```typescript
// Best practices for Redis client configuration
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  
  // Connection options
  socket: {
    connectTimeout: 5000,        // 5 second connection timeout
    keepAlive: 30000,            // Keep-alive every 30 seconds
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Max retries reached');
      }
      // Exponential backoff: 100ms, 200ms, 400ms, 800ms...
      return Math.min(100 * Math.pow(2, retries), 3000);
    }
  },
  
  // Command options
  commandsQueueMaxLength: 1000,  // Limit queued commands
});

// Event handlers for monitoring
redisClient.on('connect', () => {
  console.log('Redis: Connected');
});

redisClient.on('ready', () => {
  console.log('Redis: Ready to accept commands');
});

redisClient.on('error', (err) => {
  console.error('Redis Error:', err);
  // Alert your monitoring system
});

redisClient.on('reconnecting', () => {
  console.warn('Redis: Reconnecting...');
});

redisClient.on('end', () => {
  console.log('Redis: Connection closed');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redisClient.quit();
  process.exit(0);
});
```

### Health Check Endpoint

```typescript
// Health check for Kubernetes probes
app.get('/health/redis', async (req, res) => {
  try {
    const start = Date.now();
    await redisClient.ping();
    const latency = Date.now() - start;
    
    res.json({
      status: 'healthy',
      latency: `${latency}ms`
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

---

## 4️⃣ Memory Management

### Memory Policies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REDIS MEMORY POLICIES                                     │
│                                                                              │
│   Policy              │ Description                    │ Best For           │
│   ────────────────────┼────────────────────────────────┼─────────────────   │
│   noeviction          │ Error when memory full         │ Critical data      │
│   allkeys-lru         │ Evict least recently used      │ Cache (default)    │
│   allkeys-lfu         │ Evict least frequently used    │ Hot/cold data      │
│   volatile-lru        │ LRU only keys with TTL         │ Mixed data         │
│   volatile-lfu        │ LFU only keys with TTL         │ Mixed data         │
│   allkeys-random      │ Random eviction                │ Testing            │
│   volatile-ttl        │ Evict shortest TTL first       │ Time-sensitive     │
│                                                                              │
│   RECOMMENDED FOR E-COMMERCE CACHE: allkeys-lru                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Memory Monitoring

```typescript
class RedisMemoryMonitor {
  private redis: RedisClientType;
  private alertThreshold = 0.85; // Alert at 85% memory usage

  async getMemoryStats(): Promise<{
    used: number;
    peak: number;
    maxMemory: number;
    usagePercent: number;
    fragmentationRatio: number;
  }> {
    const info = await this.redis.info('memory');
    
    const parseValue = (key: string): number => {
      const match = info.match(new RegExp(`${key}:(\\d+)`));
      return match ? parseInt(match[1]) : 0;
    };
    
    const used = parseValue('used_memory');
    const peak = parseValue('used_memory_peak');
    const maxMemory = parseValue('maxmemory') || Infinity;
    const rss = parseValue('used_memory_rss');
    
    return {
      used,
      peak,
      maxMemory,
      usagePercent: maxMemory ? (used / maxMemory) * 100 : 0,
      fragmentationRatio: rss / used
    };
  }

  async checkAndAlert(): Promise<void> {
    const stats = await this.getMemoryStats();
    
    if (stats.usagePercent > this.alertThreshold * 100) {
      console.error(`ALERT: Redis memory at ${stats.usagePercent.toFixed(1)}%`);
      // Send alert to monitoring system
    }
    
    if (stats.fragmentationRatio > 1.5) {
      console.warn(`WARNING: High memory fragmentation: ${stats.fragmentationRatio.toFixed(2)}`);
    }
  }
}
```

---

## 5️⃣ Performance Monitoring

### Key Metrics to Track

```typescript
class RedisMetrics {
  private redis: RedisClientType;

  async collectMetrics(): Promise<{
    commands: { total: number; perSecond: number };
    connections: { current: number; total: number };
    memory: { used: number; peak: number };
    keyspace: { hits: number; misses: number; hitRate: number };
    latency: number;
  }> {
    const info = await this.redis.info();
    
    // Parse INFO output
    const getValue = (section: string, key: string): number => {
      const regex = new RegExp(`${key}:(\\d+\\.?\\d*)`);
      const match = info.match(regex);
      return match ? parseFloat(match[1]) : 0;
    };
    
    const hits = getValue('Stats', 'keyspace_hits');
    const misses = getValue('Stats', 'keyspace_misses');
    
    // Measure command latency
    const start = Date.now();
    await this.redis.ping();
    const latency = Date.now() - start;
    
    return {
      commands: {
        total: getValue('Stats', 'total_commands_processed'),
        perSecond: getValue('Stats', 'instantaneous_ops_per_sec')
      },
      connections: {
        current: getValue('Clients', 'connected_clients'),
        total: getValue('Stats', 'total_connections_received')
      },
      memory: {
        used: getValue('Memory', 'used_memory'),
        peak: getValue('Memory', 'used_memory_peak')
      },
      keyspace: {
        hits,
        misses,
        hitRate: hits / (hits + misses) || 0
      },
      latency
    };
  }
}
```

### Prometheus Metrics Export

```typescript
import { Registry, Counter, Gauge, Histogram } from 'prom-client';

class RedisPrometheusExporter {
  private registry: Registry;
  private commandCounter: Counter;
  private memoryGauge: Gauge;
  private latencyHistogram: Histogram;
  private cacheHitRate: Gauge;

  constructor() {
    this.registry = new Registry();
    
    this.commandCounter = new Counter({
      name: 'redis_commands_total',
      help: 'Total Redis commands executed',
      labelNames: ['command'],
      registers: [this.registry]
    });
    
    this.memoryGauge = new Gauge({
      name: 'redis_memory_bytes',
      help: 'Redis memory usage',
      labelNames: ['type'],
      registers: [this.registry]
    });
    
    this.latencyHistogram = new Histogram({
      name: 'redis_command_duration_seconds',
      help: 'Redis command latency',
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
      registers: [this.registry]
    });
    
    this.cacheHitRate = new Gauge({
      name: 'redis_cache_hit_rate',
      help: 'Cache hit rate',
      registers: [this.registry]
    });
  }

  // Instrument Redis client
  wrapClient(client: RedisClientType): RedisClientType {
    const originalExec = client.sendCommand.bind(client);
    
    client.sendCommand = async (args: string[]) => {
      const start = Date.now();
      try {
        const result = await originalExec(args);
        this.commandCounter.inc({ command: args[0] });
        this.latencyHistogram.observe((Date.now() - start) / 1000);
        return result;
      } catch (error) {
        throw error;
      }
    };
    
    return client;
  }

  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }
}
```

---

## 6️⃣ Security Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REDIS SECURITY CHECKLIST                                  │
│                                                                              │
│   ✅ Authentication                                                         │
│   ─────────────────                                                         │
│   requirepass your-strong-password-here                                     │
│   # Or ACL for fine-grained access                                          │
│                                                                              │
│   ✅ Network Security                                                       │
│   ───────────────────                                                       │
│   bind 127.0.0.1                    # Only localhost                        │
│   protected-mode yes                 # Reject external connections          │
│   # In K8s: Use NetworkPolicy                                               │
│                                                                              │
│   ✅ TLS Encryption                                                         │
│   ─────────────────                                                         │
│   tls-port 6379                                                             │
│   tls-cert-file /path/to/redis.crt                                          │
│   tls-key-file /path/to/redis.key                                           │
│   tls-ca-cert-file /path/to/ca.crt                                          │
│                                                                              │
│   ✅ Dangerous Commands                                                     │
│   ─────────────────────                                                     │
│   rename-command FLUSHALL ""         # Disable FLUSHALL                     │
│   rename-command CONFIG ""           # Disable CONFIG                       │
│   rename-command DEBUG ""            # Disable DEBUG                        │
│   rename-command KEYS "KEYS_ADMIN"   # Rename KEYS                          │
│                                                                              │
│   ✅ Resource Limits                                                        │
│   ──────────────────                                                        │
│   maxmemory 256mb                                                           │
│   maxclients 1000                                                           │
│   timeout 300                        # Close idle connections               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Kubernetes Secret for Redis Password

```yaml
# k8s/secret/redis-secret.yml
apiVersion: v1
kind: Secret
metadata:
  name: redis-secret
type: Opaque
stringData:
  password: your-secure-password-here
---
# Reference in deployment
env:
  - name: REDIS_PASSWORD
    valueFrom:
      secretKeyRef:
        name: redis-secret
        key: password
```

---

## 7️⃣ Backup and Recovery

### RDB Snapshots (Point-in-time)

```
# redis.conf
save 900 1      # Save if 1 key changed in 900 seconds
save 300 10     # Save if 10 keys changed in 300 seconds
save 60 10000   # Save if 10000 keys changed in 60 seconds

dbfilename dump.rdb
dir /data
```

### AOF (Append Only File)

```
# redis.conf
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec   # Balance durability and performance

# AOF rewrite (compaction)
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

### Backup Script

```bash
#!/bin/bash
# backup-redis.sh

BACKUP_DIR="/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)

# Trigger RDB save
redis-cli BGSAVE
sleep 5  # Wait for save to complete

# Copy RDB file
cp /data/dump.rdb "$BACKUP_DIR/dump_$DATE.rdb"

# Compress
gzip "$BACKUP_DIR/dump_$DATE.rdb"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/dump_$DATE.rdb.gz" s3://your-bucket/redis-backups/

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "dump_*.rdb.gz" -mtime +7 -delete

echo "Backup completed: dump_$DATE.rdb.gz"
```

---

## 8️⃣ Common Production Issues

### Issue 1: Memory Fragmentation

```typescript
// Monitor and handle fragmentation
async function checkFragmentation(): Promise<void> {
  const info = await redis.info('memory');
  const fragRatio = parseFloat(info.match(/mem_fragmentation_ratio:(\d+\.?\d*)/)?.[1] || '1');
  
  if (fragRatio > 1.5) {
    console.warn(`High fragmentation: ${fragRatio}`);
    // Consider MEMORY DOCTOR command in Redis 7+
    // Or schedule a restart during low-traffic
  }
}
```

### Issue 2: Slow Queries

```typescript
// Configure slow log
await redis.configSet('slowlog-log-slower-than', '10000'); // 10ms
await redis.configSet('slowlog-max-len', '128');

// Check slow log
const slowLog = await redis.slowlogGet(10);
for (const entry of slowLog) {
  console.log(`Slow command: ${entry.arguments.join(' ')} took ${entry.durationMicros / 1000}ms`);
}
```

### Issue 3: Connection Exhaustion

```typescript
// Monitor connections
async function checkConnections(): Promise<void> {
  const info = await redis.info('clients');
  const connected = parseInt(info.match(/connected_clients:(\d+)/)?.[1] || '0');
  const blocked = parseInt(info.match(/blocked_clients:(\d+)/)?.[1] || '0');
  
  if (connected > 900) { // Assuming maxclients=1000
    console.error(`High connection count: ${connected}`);
  }
  
  if (blocked > 10) {
    console.warn(`Blocked clients: ${blocked}`);
  }
}
```

---

## 📊 Production Checklist

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION READINESS CHECKLIST                            │
│                                                                              │
│   INFRASTRUCTURE:                                                           │
│   ☐ High availability setup (Sentinel or Cluster)                           │
│   ☐ Adequate memory provisioned (2x working set)                            │
│   ☐ Persistent storage configured                                           │
│   ☐ Network security (TLS, firewall)                                        │
│                                                                              │
│   CONFIGURATION:                                                            │
│   ☐ maxmemory set appropriately                                             │
│   ☐ maxmemory-policy configured (allkeys-lru for cache)                    │
│   ☐ Authentication enabled                                                  │
│   ☐ Dangerous commands disabled                                             │
│   ☐ Persistence configured (RDB/AOF)                                        │
│                                                                              │
│   MONITORING:                                                               │
│   ☐ Memory usage alerts                                                     │
│   ☐ Connection count alerts                                                 │
│   ☐ Latency monitoring                                                      │
│   ☐ Cache hit rate tracking                                                 │
│   ☐ Slow query logging                                                      │
│                                                                              │
│   OPERATIONS:                                                               │
│   ☐ Backup schedule configured                                              │
│   ☐ Recovery procedure documented                                           │
│   ☐ Scaling plan documented                                                 │
│   ☐ Incident runbook created                                                │
│                                                                              │
│   APPLICATION:                                                              │
│   ☐ Connection pooling configured                                           │
│   ☐ Reconnection logic implemented                                          │
│   ☐ Circuit breaker for Redis failures                                      │
│   ☐ Graceful degradation (cache miss = DB query)                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Quick Recap

| Aspect | Best Practice |
|--------|---------------|
| **High Availability** | Sentinel for HA, Cluster for scale |
| **Memory** | Set maxmemory, use allkeys-lru |
| **Security** | Password + TLS + Network isolation |
| **Monitoring** | Memory, latency, hit rate, connections |
| **Backup** | RDB snapshots + AOF for durability |

---

## 🎉 Congratulations!

You've completed the Redis Caching Patterns learning module! You now understand:

- ✅ Redis data types and commands
- ✅ Caching patterns (cache-aside, write-through)
- ✅ Cache invalidation strategies
- ✅ Distributed locks for flash sales
- ✅ Rate limiting for API protection
- ✅ Session management
- ✅ Sorted sets for trending/leaderboards
- ✅ Production best practices

### Next Steps

1. **Apply to your project**: Enhance your Product Service caching
2. **Add new features**: Implement rate limiting, trending products
3. **Continue learning**: Move to the next topic in your roadmap!

---

## 🔗 Resources

- [Redis Official Documentation](https://redis.io/docs/)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [Redis University](https://university.redis.com/) (Free courses!)

---

**← [Back to Index](./00-index.md) | [Next Topic: Circuit Breaker →](../../learning-roadmap/README.md)**

