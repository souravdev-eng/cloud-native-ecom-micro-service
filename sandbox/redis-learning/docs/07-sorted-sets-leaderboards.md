# 📚 Chapter 7: Sorted Sets & Leaderboards

## 🎯 Learning Objectives

By the end of this chapter, you will understand:

- When and why to use Sorted Sets
- Building real-time leaderboards
- Implementing trending products
- Search autocomplete with Redis

---

## 🤔 Why Sorted Sets?

Sorted Sets are one of Redis's most powerful data structures - they maintain elements sorted by score automatically.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SORTED SET SUPERPOWERS                                    │
│                                                                              │
│   Regular Set:                      Sorted Set (ZSet):                      │
│   ────────────                      ───────────────────                     │
│   { "a", "b", "c" }                 { a:10, b:25, c:15 }                    │
│   (no order)                        (sorted by score!)                      │
│                                                                              │
│   Operations you can do:                                                    │
│   ──────────────────────                                                    │
│   • Get top N items                 O(log(N) + M)                           │
│   • Get items by score range        O(log(N) + M)                           │
│   • Get rank of an item             O(log(N))                               │
│   • Increment score atomically      O(log(N))                               │
│                                                                              │
│   Perfect for:                                                              │
│   • Leaderboards                    • Time-based data                       │
│   • Trending/Popular items          • Priority queues                       │
│   • Autocomplete                    • Geospatial indexes                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1️⃣ E-commerce Trending Products

Track and display trending products based on views, purchases, or engagement.

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRENDING PRODUCTS FLOW                                    │
│                                                                              │
│   User views product:123                                                    │
│        │                                                                     │
│        ▼                                                                     │
│   ZINCRBY trending:daily 1 "product:123"                                    │
│   ZINCRBY trending:weekly 1 "product:123"                                   │
│   ZINCRBY trending:category:electronics 1 "product:123"                     │
│        │                                                                     │
│        ▼                                                                     │
│   Sorted Set updates automatically                                          │
│        │                                                                     │
│        ▼                                                                     │
│   Get trending: ZREVRANGE trending:daily 0 9                                │
│   Returns: Top 10 most viewed products today!                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
class TrendingProductsService {
  private redis: RedisClientType;

  /**
   * Track a product view/interaction
   */
  async trackInteraction(
    productId: string, 
    type: 'view' | 'cart' | 'purchase',
    metadata?: { category?: string; price?: number }
  ): Promise<void> {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().toISOString().slice(0, 13);
    
    // Different weights for different interactions
    const weights = { view: 1, cart: 5, purchase: 10 };
    const weight = weights[type];
    
    // Increment in multiple time windows (pipeline for efficiency)
    const pipeline = this.redis.multi();
    
    // Hourly trending (for real-time dashboard)
    pipeline.zIncrBy(`trending:hourly:${hour}`, weight, productId);
    pipeline.expire(`trending:hourly:${hour}`, 7200); // 2 hours
    
    // Daily trending
    pipeline.zIncrBy(`trending:daily:${today}`, weight, productId);
    pipeline.expire(`trending:daily:${today}`, 172800); // 48 hours
    
    // Weekly trending (rolling)
    pipeline.zIncrBy('trending:weekly', weight, productId);
    
    // Category-specific trending
    if (metadata?.category) {
      pipeline.zIncrBy(`trending:category:${metadata.category}`, weight, productId);
      pipeline.expire(`trending:category:${metadata.category}`, 86400);
    }
    
    await pipeline.exec();
  }

  /**
   * Get trending products
   */
  async getTrending(options: {
    period: 'hourly' | 'daily' | 'weekly';
    category?: string;
    limit?: number;
    offset?: number;
  } = { period: 'daily' }): Promise<{ productId: string; score: number }[]> {
    const { period, category, limit = 10, offset = 0 } = options;
    
    let key: string;
    if (category) {
      key = `trending:category:${category}`;
    } else if (period === 'hourly') {
      const hour = new Date().toISOString().slice(0, 13);
      key = `trending:hourly:${hour}`;
    } else if (period === 'daily') {
      const today = new Date().toISOString().split('T')[0];
      key = `trending:daily:${today}`;
    } else {
      key = 'trending:weekly';
    }
    
    // Get top products with scores
    const results = await this.redis.zRangeWithScores(
      key,
      offset,
      offset + limit - 1,
      { REV: true } // Descending order (highest first)
    );
    
    return results.map(({ value, score }) => ({
      productId: value,
      score
    }));
  }

  /**
   * Get product rank in trending
   */
  async getProductRank(productId: string, period: 'daily' | 'weekly' = 'daily'): Promise<number | null> {
    const key = period === 'daily' 
      ? `trending:daily:${new Date().toISOString().split('T')[0]}`
      : 'trending:weekly';
    
    const rank = await this.redis.zRevRank(key, productId);
    return rank !== null ? rank + 1 : null; // 1-indexed
  }

  /**
   * Decay old scores (run daily via cron)
   */
  async decayWeeklyScores(factor: number = 0.9): Promise<void> {
    // Get all products in weekly trending
    const products = await this.redis.zRangeWithScores('trending:weekly', 0, -1);
    
    // Apply decay factor
    const pipeline = this.redis.multi();
    for (const { value, score } of products) {
      const newScore = Math.floor(score * factor);
      if (newScore > 0) {
        pipeline.zAdd('trending:weekly', { score: newScore, value });
      } else {
        pipeline.zRem('trending:weekly', value);
      }
    }
    
    await pipeline.exec();
  }
}
```

### Usage in Routes

```typescript
// Track product view
router.get('/api/product/:id', requireAuth, async (req, res) => {
  const product = await productService.getById(req.params.id);
  
  // Track this view
  await trendingService.trackInteraction(product.id, 'view', {
    category: product.category
  });
  
  res.json(product);
});

// Get trending products
router.get('/api/products/trending', async (req, res) => {
  const { period = 'daily', category, limit = 10 } = req.query;
  
  const trending = await trendingService.getTrending({
    period: period as 'daily' | 'weekly',
    category: category as string,
    limit: Number(limit)
  });
  
  // Fetch full product details
  const products = await productService.getByIds(trending.map(t => t.productId));
  
  res.json({
    products,
    trending // Include scores for transparency
  });
});
```

---

## 2️⃣ Real-Time Leaderboards

### User Points/Rewards Leaderboard

```typescript
class LeaderboardService {
  private redis: RedisClientType;

  /**
   * Add or update user score
   */
  async updateScore(
    leaderboardId: string,
    userId: string,
    score: number
  ): Promise<number> {
    // ZADD returns 1 if new, 0 if updated
    const key = `leaderboard:${leaderboardId}`;
    await this.redis.zAdd(key, { score, value: userId });
    
    // Return new rank
    const rank = await this.redis.zRevRank(key, userId);
    return rank !== null ? rank + 1 : -1;
  }

  /**
   * Increment user score (for point systems)
   */
  async addPoints(
    leaderboardId: string,
    userId: string,
    points: number
  ): Promise<{ newScore: number; rank: number }> {
    const key = `leaderboard:${leaderboardId}`;
    const newScore = await this.redis.zIncrBy(key, points, userId);
    const rank = await this.redis.zRevRank(key, userId);
    
    return {
      newScore,
      rank: rank !== null ? rank + 1 : -1
    };
  }

  /**
   * Get top N users
   */
  async getTopUsers(
    leaderboardId: string,
    limit: number = 10
  ): Promise<{ userId: string; score: number; rank: number }[]> {
    const key = `leaderboard:${leaderboardId}`;
    const results = await this.redis.zRangeWithScores(key, 0, limit - 1, { REV: true });
    
    return results.map(({ value, score }, index) => ({
      userId: value,
      score,
      rank: index + 1
    }));
  }

  /**
   * Get user's rank and nearby users
   */
  async getUserRankWithContext(
    leaderboardId: string,
    userId: string,
    contextSize: number = 2
  ): Promise<{
    user: { userId: string; score: number; rank: number };
    above: { userId: string; score: number; rank: number }[];
    below: { userId: string; score: number; rank: number }[];
  } | null> {
    const key = `leaderboard:${leaderboardId}`;
    
    // Get user's rank
    const rank = await this.redis.zRevRank(key, userId);
    if (rank === null) return null;
    
    // Get user's score
    const score = await this.redis.zScore(key, userId);
    
    // Get context (users above and below)
    const startIndex = Math.max(0, rank - contextSize);
    const endIndex = rank + contextSize;
    
    const results = await this.redis.zRangeWithScores(key, startIndex, endIndex, { REV: true });
    
    const userIndex = rank - startIndex;
    const above = results.slice(0, userIndex).map((r, i) => ({
      userId: r.value,
      score: r.score,
      rank: startIndex + i + 1
    }));
    const below = results.slice(userIndex + 1).map((r, i) => ({
      userId: r.value,
      score: r.score,
      rank: rank + i + 2
    }));
    
    return {
      user: { userId, score: score!, rank: rank + 1 },
      above,
      below
    };
  }

  /**
   * Get total participants
   */
  async getParticipantCount(leaderboardId: string): Promise<number> {
    return await this.redis.zCard(`leaderboard:${leaderboardId}`);
  }
}
```

### Monthly/Weekly Reset

```typescript
class SeasonalLeaderboard {
  /**
   * Archive and reset leaderboard
   */
  async resetLeaderboard(leaderboardId: string): Promise<void> {
    const key = `leaderboard:${leaderboardId}`;
    const archiveKey = `leaderboard:${leaderboardId}:archive:${Date.now()}`;
    
    // Copy to archive
    await this.redis.copy(key, archiveKey);
    
    // Delete current leaderboard
    await this.redis.del(key);
    
    // Set archive expiry (keep for 90 days)
    await this.redis.expire(archiveKey, 90 * 24 * 60 * 60);
  }

  /**
   * Combine multiple period leaderboards
   */
  async combineLeaderboards(
    sourceKeys: string[],
    destKey: string,
    weights?: number[]
  ): Promise<void> {
    await this.redis.zUnionStore(destKey, sourceKeys, {
      WEIGHTS: weights,
      AGGREGATE: 'SUM'
    });
  }
}
```

---

## 3️⃣ Search Autocomplete

Use Sorted Sets for fast, ranked autocomplete suggestions.

### Approach 1: Prefix-Based Autocomplete

```typescript
class AutocompleteService {
  private redis: RedisClientType;
  private key = 'autocomplete:products';

  /**
   * Index a product for autocomplete
   */
  async indexProduct(product: { id: string; title: string; popularity: number }): Promise<void> {
    const title = product.title.toLowerCase();
    
    // Add all prefixes
    for (let i = 1; i <= title.length; i++) {
      const prefix = title.slice(0, i);
      // Store as: prefix -> product ID with popularity score
      await this.redis.zAdd(`autocomplete:prefix:${prefix}`, {
        score: product.popularity,
        value: JSON.stringify({ id: product.id, title: product.title })
      });
    }
    
    // Limit each prefix set to top 10
    await this.trimPrefixSets(title);
  }

  private async trimPrefixSets(title: string): Promise<void> {
    for (let i = 1; i <= title.length; i++) {
      const prefix = title.slice(0, i);
      // Keep only top 10 for each prefix
      await this.redis.zRemRangeByRank(`autocomplete:prefix:${prefix}`, 0, -11);
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async getSuggestions(query: string, limit: number = 5): Promise<{ id: string; title: string }[]> {
    const prefix = query.toLowerCase();
    const key = `autocomplete:prefix:${prefix}`;
    
    const results = await this.redis.zRange(key, 0, limit - 1, { REV: true });
    
    return results.map(r => JSON.parse(r));
  }

  /**
   * Remove product from autocomplete
   */
  async removeProduct(product: { id: string; title: string }): Promise<void> {
    const title = product.title.toLowerCase();
    const value = JSON.stringify({ id: product.id, title: product.title });
    
    for (let i = 1; i <= title.length; i++) {
      const prefix = title.slice(0, i);
      await this.redis.zRem(`autocomplete:prefix:${prefix}`, value);
    }
  }
}
```

### Approach 2: Completion Suggester (More Efficient)

```typescript
class CompletionSuggester {
  private redis: RedisClientType;

  /**
   * Index search term with completion entries
   */
  async indexTerm(term: string, score: number = 0): Promise<void> {
    const normalized = term.toLowerCase().trim();
    
    // Store the complete term
    await this.redis.zAdd('autocomplete:terms', { score, value: normalized + '*' });
    
    // Store all prefixes for completion matching
    for (let i = 1; i < normalized.length; i++) {
      const prefix = normalized.slice(0, i);
      await this.redis.zAdd('autocomplete:terms', { score: 0, value: prefix });
    }
  }

  /**
   * Get completions for query
   */
  async complete(query: string, limit: number = 10): Promise<string[]> {
    const normalized = query.toLowerCase().trim();
    
    // Find range of matching prefixes
    const results: string[] = [];
    let cursor = await this.redis.zRank('autocomplete:terms', normalized);
    
    if (cursor === null) return [];
    
    // Scan forward to find completions (terms ending with *)
    const range = await this.redis.zRange('autocomplete:terms', cursor, cursor + 50);
    
    for (const term of range) {
      if (!term.startsWith(normalized)) break;
      if (term.endsWith('*')) {
        results.push(term.slice(0, -1)); // Remove *
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }

  /**
   * Boost a term (when user selects it)
   */
  async boostTerm(term: string, amount: number = 1): Promise<void> {
    const normalized = term.toLowerCase().trim() + '*';
    await this.redis.zIncrBy('autocomplete:terms', amount, normalized);
  }
}
```

---

## 4️⃣ Price Range Filtering

Use scores for numeric filtering:

```typescript
class ProductPriceIndex {
  private redis: RedisClientType;

  /**
   * Index product by price
   */
  async indexProduct(productId: string, price: number, category?: string): Promise<void> {
    // Global price index
    await this.redis.zAdd('products:by_price', { score: price, value: productId });
    
    // Category-specific price index
    if (category) {
      await this.redis.zAdd(`products:by_price:${category}`, { score: price, value: productId });
    }
  }

  /**
   * Get products in price range
   */
  async getByPriceRange(
    minPrice: number,
    maxPrice: number,
    options?: { category?: string; limit?: number; offset?: number }
  ): Promise<string[]> {
    const { category, limit = 20, offset = 0 } = options || {};
    const key = category ? `products:by_price:${category}` : 'products:by_price';
    
    return await this.redis.zRangeByScore(key, minPrice, maxPrice, {
      LIMIT: { offset, count: limit }
    });
  }

  /**
   * Get price statistics
   */
  async getPriceStats(category?: string): Promise<{
    min: number;
    max: number;
    count: number;
  }> {
    const key = category ? `products:by_price:${category}` : 'products:by_price';
    
    const [minResult, maxResult, count] = await Promise.all([
      this.redis.zRangeWithScores(key, 0, 0),
      this.redis.zRangeWithScores(key, -1, -1),
      this.redis.zCard(key)
    ]);
    
    return {
      min: minResult[0]?.score || 0,
      max: maxResult[0]?.score || 0,
      count
    };
  }
}
```

---

## 📊 Sorted Set Commands Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SORTED SET COMMANDS                                       │
│                                                                              │
│   ADD/UPDATE:                                                               │
│   ───────────                                                               │
│   ZADD key score member              # Add/update member                    │
│   ZINCRBY key increment member       # Increment score                      │
│                                                                              │
│   GET BY RANK:                                                              │
│   ────────────                                                              │
│   ZRANGE key start stop              # Get by rank (ascending)              │
│   ZREVRANGE key start stop           # Get by rank (descending)             │
│   ZRANK key member                   # Get rank (ascending)                 │
│   ZREVRANK key member                # Get rank (descending)                │
│                                                                              │
│   GET BY SCORE:                                                             │
│   ─────────────                                                             │
│   ZRANGEBYSCORE key min max          # Get by score range                   │
│   ZCOUNT key min max                 # Count in score range                 │
│                                                                              │
│   INFO:                                                                     │
│   ─────                                                                     │
│   ZCARD key                          # Get total count                      │
│   ZSCORE key member                  # Get member's score                   │
│                                                                              │
│   REMOVE:                                                                   │
│   ───────                                                                   │
│   ZREM key member                    # Remove member                        │
│   ZREMRANGEBYRANK key start stop     # Remove by rank range                 │
│   ZREMRANGEBYSCORE key min max       # Remove by score range                │
│                                                                              │
│   SET OPERATIONS:                                                           │
│   ───────────────                                                           │
│   ZUNIONSTORE dest numkeys key...    # Union of sets                        │
│   ZINTERSTORE dest numkeys key...    # Intersection of sets                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Quick Recap

| Use Case | Score Meaning | Key Pattern |
|----------|---------------|-------------|
| **Trending** | View/purchase count | `trending:{period}` |
| **Leaderboard** | Points/score | `leaderboard:{id}` |
| **Autocomplete** | Popularity | `autocomplete:prefix:{p}` |
| **Price Filter** | Price value | `products:by_price` |

---

## 🏋️ Exercises

1. **Trending products**: Implement trending for your Product Service
2. **Autocomplete**: Build search suggestions for product titles
3. **Leaderboard**: Create a customer rewards leaderboard

---

## ➡️ Next Chapter

[Chapter 8: Production Best Practices](./08-production-patterns.md) - Scale and monitor Redis in production!

