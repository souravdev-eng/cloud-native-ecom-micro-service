# 📚 Chapter 6: Session Management

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

- Why Redis is perfect for session storage
- Session management patterns
- Implementing secure sessions
- Cart state management across services

---

## 🤔 Why Store Sessions in Redis?

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SESSION STORAGE OPTIONS                                   │
│                                                                              │
│   Option 1: Server Memory                                                   │
│   ──────────────────────                                                    │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                                 │
│   │ Server 1 │  │ Server 2 │  │ Server 3 │                                 │
│   │ Session A│  │ Session B│  │ Session C│                                 │
│   └──────────┘  └──────────┘  └──────────┘                                 │
│   ❌ Sessions lost on restart                                               │
│   ❌ Can't scale horizontally (sticky sessions required)                   │
│                                                                              │
│   Option 2: Database                                                        │
│   ──────────────────                                                        │
│   Every request → Database query                                            │
│   ❌ Slow (disk I/O)                                                        │
│   ❌ Database becomes bottleneck                                            │
│                                                                              │
│   Option 3: Redis ✅                                                        │
│   ───────────────────                                                       │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                                 │
│   │ Server 1 │──┤          ├──│ Server 3 │                                 │
│   └──────────┘  │  REDIS   │  └──────────┘                                 │
│   ┌──────────┐──┤ Sessions │                                               │
│   │ Server 2 │  │          │                                               │
│   └──────────┘  └──────────┘                                               │
│   ✅ Fast (in-memory)                                                       │
│   ✅ Shared across all servers                                              │
│   ✅ Auto-expiration (TTL)                                                  │
│   ✅ Persistence options                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ Basic Session Store

### Session Data Structure

```typescript
interface Session {
  id: string;
  userId: string;
  data: {
    email: string;
    role: 'user' | 'admin' | 'seller';
    preferences?: Record<string, unknown>;
  };
  createdAt: number;
  lastAccess: number;
  expiresAt: number;
}
```

### Implementation

```typescript
import crypto from 'crypto';
import { RedisClientType } from 'redis';

class RedisSessionStore {
  private redis: RedisClientType;
  private prefix = 'session:';
  private defaultTTL = 24 * 60 * 60; // 24 hours

  constructor(redis: RedisClientType) {
    this.redis = redis;
  }

  /**
   * Create a new session
   */
  async create(userId: string, data: Session['data']): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    
    const session: Session = {
      id: sessionId,
      userId,
      data,
      createdAt: now,
      lastAccess: now,
      expiresAt: now + (this.defaultTTL * 1000)
    };
    
    await this.redis.set(
      this.prefix + sessionId,
      JSON.stringify(session),
      { EX: this.defaultTTL }
    );
    
    // Track user's sessions (for "logout all devices")
    await this.redis.sAdd(`user:${userId}:sessions`, sessionId);
    
    return sessionId;
  }

  /**
   * Get session by ID
   */
  async get(sessionId: string): Promise<Session | null> {
    const data = await this.redis.get(this.prefix + sessionId);
    if (!data) return null;
    
    const session = JSON.parse(data) as Session;
    
    // Update last access time (sliding expiration)
    session.lastAccess = Date.now();
    await this.redis.set(
      this.prefix + sessionId,
      JSON.stringify(session),
      { EX: this.defaultTTL }
    );
    
    return session;
  }

  /**
   * Update session data
   */
  async update(sessionId: string, data: Partial<Session['data']>): Promise<boolean> {
    const session = await this.get(sessionId);
    if (!session) return false;
    
    session.data = { ...session.data, ...data };
    session.lastAccess = Date.now();
    
    await this.redis.set(
      this.prefix + sessionId,
      JSON.stringify(session),
      { EX: this.defaultTTL }
    );
    
    return true;
  }

  /**
   * Destroy session
   */
  async destroy(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    if (session) {
      // Remove from user's session set
      await this.redis.sRem(`user:${session.userId}:sessions`, sessionId);
    }
    await this.redis.del(this.prefix + sessionId);
  }

  /**
   * Destroy all sessions for a user (logout everywhere)
   */
  async destroyAllForUser(userId: string): Promise<number> {
    const sessionIds = await this.redis.sMembers(`user:${userId}:sessions`);
    
    if (sessionIds.length > 0) {
      // Delete all session keys
      await this.redis.del(sessionIds.map(id => this.prefix + id));
      // Clear the user's session set
      await this.redis.del(`user:${userId}:sessions`);
    }
    
    return sessionIds.length;
  }
}
```

---

## 2️⃣ Express Session Middleware

### Using express-session with Redis

```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

// Create Redis client
const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

// Initialize store
const redisStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:',
  ttl: 86400 // 24 hours
});

// Configure session middleware
app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // Cookie name
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true, // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CSRF protection
  }
}));

// Usage in routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await authService.validateCredentials(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Store user in session
  req.session.user = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  res.json({ success: true, user: req.session.user });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('sessionId');
    res.json({ success: true });
  });
});
```

---

## 3️⃣ JWT + Redis (Revocable Tokens)

**Problem:** JWTs can't be revoked once issued.

**Solution:** Store valid tokens in Redis, check on each request.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    JWT + REDIS PATTERN                                       │
│                                                                              │
│   Traditional JWT (Stateless):                                              │
│   ────────────────────────────                                              │
│   Token issued → Valid until expiry                                         │
│   ❌ Can't revoke (user logged out but token still works!)                  │
│                                                                              │
│   JWT + Redis (Revocable):                                                  │
│   ────────────────────────                                                  │
│   Token issued → Store token ID in Redis                                    │
│   Each request → Check Redis: Is token ID valid?                            │
│   Logout → Delete token ID from Redis                                       │
│   ✅ Can revoke anytime                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
import jwt from 'jsonwebtoken';

class TokenService {
  private redis: RedisClientType;
  private jwtSecret: string;
  private accessTTL = 15 * 60; // 15 minutes
  private refreshTTL = 7 * 24 * 60 * 60; // 7 days

  /**
   * Issue access and refresh tokens
   */
  async issueTokens(userId: string, data: { email: string; role: string }) {
    const tokenId = crypto.randomUUID();
    
    // Access token (short-lived)
    const accessToken = jwt.sign(
      { userId, tokenId, type: 'access', ...data },
      this.jwtSecret,
      { expiresIn: '15m' }
    );
    
    // Refresh token (long-lived)
    const refreshToken = jwt.sign(
      { userId, tokenId, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
    
    // Store token ID in Redis (whitelist approach)
    await this.redis.set(
      `token:${tokenId}`,
      JSON.stringify({ userId, issuedAt: Date.now() }),
      { EX: this.refreshTTL }
    );
    
    // Track user's tokens
    await this.redis.sAdd(`user:${userId}:tokens`, tokenId);
    await this.redis.expire(`user:${userId}:tokens`, this.refreshTTL);
    
    return { accessToken, refreshToken };
  }

  /**
   * Verify token is valid and not revoked
   */
  async verifyToken(token: string): Promise<{ valid: boolean; payload?: any }> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as any;
      
      // Check if token is in Redis (not revoked)
      const exists = await this.redis.exists(`token:${payload.tokenId}`);
      
      if (!exists) {
        return { valid: false }; // Token was revoked
      }
      
      return { valid: true, payload };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    const result = await this.verifyToken(refreshToken);
    
    if (!result.valid || result.payload.type !== 'refresh') {
      return null;
    }
    
    // Issue new access token with same tokenId
    const accessToken = jwt.sign(
      { 
        userId: result.payload.userId, 
        tokenId: result.payload.tokenId,
        type: 'access'
      },
      this.jwtSecret,
      { expiresIn: '15m' }
    );
    
    return accessToken;
  }

  /**
   * Revoke a specific token
   */
  async revokeToken(tokenId: string): Promise<void> {
    const data = await this.redis.get(`token:${tokenId}`);
    if (data) {
      const { userId } = JSON.parse(data);
      await this.redis.sRem(`user:${userId}:tokens`, tokenId);
    }
    await this.redis.del(`token:${tokenId}`);
  }

  /**
   * Revoke all tokens for user (logout everywhere)
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    const tokenIds = await this.redis.sMembers(`user:${userId}:tokens`);
    
    if (tokenIds.length > 0) {
      await this.redis.del(tokenIds.map(id => `token:${id}`));
      await this.redis.del(`user:${userId}:tokens`);
    }
    
    return tokenIds.length;
  }
}
```

### Auth Middleware

```typescript
// middleware/auth.ts
export const authMiddleware = (tokenService: TokenService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const result = await tokenService.verifyToken(token);
    
    if (!result.valid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.user = result.payload;
    next();
  };
};
```

---

## 4️⃣ Shopping Cart with Redis

Carts are perfect for Redis - temporary, frequently updated, and shared across sessions.

### Cart Data Structure

```typescript
interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  addedAt: number;
}

interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: number;
}
```

### Cart Service

```typescript
class CartService {
  private redis: RedisClientType;
  private cartTTL = 7 * 24 * 60 * 60; // 7 days

  private cartKey(userId: string): string {
    return `cart:${userId}`;
  }

  /**
   * Get cart contents
   */
  async getCart(userId: string): Promise<Cart> {
    const data = await this.redis.hGetAll(this.cartKey(userId));
    
    const items: CartItem[] = Object.entries(data).map(([productId, value]) => {
      const item = JSON.parse(value);
      return { productId, ...item };
    });
    
    return {
      userId,
      items,
      updatedAt: Date.now()
    };
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, item: Omit<CartItem, 'addedAt'>): Promise<Cart> {
    const key = this.cartKey(userId);
    
    // Check if item exists
    const existing = await this.redis.hGet(key, item.productId);
    
    if (existing) {
      const existingItem = JSON.parse(existing);
      existingItem.quantity += item.quantity;
      await this.redis.hSet(key, item.productId, JSON.stringify(existingItem));
    } else {
      await this.redis.hSet(key, item.productId, JSON.stringify({
        quantity: item.quantity,
        price: item.price,
        addedAt: Date.now()
      }));
    }
    
    // Reset TTL
    await this.redis.expire(key, this.cartTTL);
    
    // Publish cart update event
    await this.redis.publish('cart:updated', JSON.stringify({ userId, productId: item.productId }));
    
    return this.getCart(userId);
  }

  /**
   * Update item quantity
   */
  async updateQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
    const key = this.cartKey(userId);
    
    if (quantity <= 0) {
      await this.redis.hDel(key, productId);
    } else {
      const existing = await this.redis.hGet(key, productId);
      if (existing) {
        const item = JSON.parse(existing);
        item.quantity = quantity;
        await this.redis.hSet(key, productId, JSON.stringify(item));
      }
    }
    
    await this.redis.expire(key, this.cartTTL);
    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, productId: string): Promise<Cart> {
    await this.redis.hDel(this.cartKey(userId), productId);
    return this.getCart(userId);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<void> {
    await this.redis.del(this.cartKey(userId));
  }

  /**
   * Get cart total
   */
  async getCartTotal(userId: string): Promise<{ items: number; total: number }> {
    const cart = await this.getCart(userId);
    
    const items = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return { items, total };
  }

  /**
   * Merge guest cart into user cart (after login)
   */
  async mergeCarts(guestId: string, userId: string): Promise<Cart> {
    const guestCart = await this.getCart(guestId);
    
    for (const item of guestCart.items) {
      await this.addItem(userId, item);
    }
    
    // Delete guest cart
    await this.clearCart(guestId);
    
    return this.getCart(userId);
  }
}
```

---

## 5️⃣ Session Security Best Practices

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SESSION SECURITY CHECKLIST                                │
│                                                                              │
│   ✅ Use secure random session IDs (32+ bytes)                              │
│   ✅ Set short TTL for sensitive sessions                                   │
│   ✅ Implement sliding expiration (extend on activity)                      │
│   ✅ Store minimal data in session                                          │
│   ✅ Use HTTPS only in production                                           │
│   ✅ Set HttpOnly and Secure cookie flags                                   │
│   ✅ Implement logout all devices                                           │
│   ✅ Regenerate session ID after login                                      │
│   ✅ Monitor for session fixation attacks                                   │
│   ✅ Rate limit session creation                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Session Regeneration After Login

```typescript
// Prevent session fixation attacks
app.post('/api/auth/login', async (req, res) => {
  const user = await authService.authenticate(req.body);
  
  // Regenerate session ID after successful login
  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).json({ error: 'Session error' });
    }
    
    req.session.user = user;
    res.json({ success: true });
  });
});
```

---

## 🧠 Quick Recap

| Pattern | Use Case | Benefits |
|---------|----------|----------|
| **Session Store** | Traditional web apps | Simple, well-supported |
| **JWT + Redis** | APIs, mobile apps | Revocable, scalable |
| **Cart Storage** | E-commerce | Fast, temporary |

---

## 🏋️ Exercises

1. **Implement sessions**: Add Redis-backed sessions to your Auth Service
2. **Cart service**: Build a cart service using Redis Hashes
3. **Multi-device**: Implement "logout all devices" functionality

---

## ➡️ Next Chapter

[Chapter 7: Sorted Sets & Leaderboards](./07-sorted-sets-leaderboards.md) - Build trending products and rankings!

