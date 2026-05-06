# 02 - Structured Logging

## Why Structured Logging?

Traditional logging:

```
2024-01-07 10:00:00 INFO User john@example.com logged in from 192.168.1.1
```

Problems:

- Hard to parse programmatically
- Can't easily filter by user or IP
- No consistent format across services

Structured logging:

```json
{
  "timestamp": "2024-01-07T10:00:00Z",
  "level": "info",
  "service": "auth",
  "correlationId": "abc-123",
  "userId": "user-456",
  "event": "user.login",
  "ip": "192.168.1.1",
  "email": "john@example.com",
  "duration_ms": 234
}
```

Benefits:

- Machine-readable (Elasticsearch can index each field)
- Queryable: "Show all login events from IP 192.168.1.1"
- Consistent across all services
- Rich context without parsing

## Key Principles

### 1. Use Standard Fields

Every log should have:

- `timestamp` - ISO 8601 format
- `level` - debug/info/warn/error/fatal
- `service` - Which microservice
- `correlationId` - From Module 01
- `message` - Human-readable description

### 2. Add Context, Not Strings

```typescript
// Bad
logger.info(`User ${userId} placed order ${orderId} for $${amount}`);

// Good
logger.info('Order placed', {
  userId,
  orderId,
  amount,
  currency: 'USD',
  itemCount: items.length,
});
```

### 3. Log at Service Boundaries

- Incoming HTTP requests
- Outgoing HTTP calls
- Database queries
- Queue operations
- Business events

### 4. Sensitive Data Rules

- Never log passwords, tokens, credit cards
- Mask PII when necessary
- Use field names that indicate sensitivity

## What You'll Build

A production-ready logging setup with:

- Structured JSON output
- Performance tracking
- Error context capture
- ELK-ready format
