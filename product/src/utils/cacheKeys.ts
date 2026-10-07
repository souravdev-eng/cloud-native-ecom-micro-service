import crypto from "crypto";

/**
 * Make a query value consistent before JSON.stringify turns it into a cache key.
 * JSON.stringify keeps object insertion order, so the same filters in a different
 * order could otherwise produce different keys. Copy each object with sorted
 * keys, including objects nested inside filters or arrays.
 *
 * Input:  { quantity: { lte: '10', gte: '1' }, category: 'book' }
 * Output: { category: 'book', quantity: { gte: '1', lte: '10' } }
 *
 * Array elements stay in their original order because that order may matter.
 * Simple values pass through unchanged. The input itself is not modified.
 */
function sortQueryValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortQueryValue);
  }

  if (value !== null && typeof value === "object") {
    // A null prototype keeps special query field names as ordinary data.
    const sorted: Record<string, unknown> = Object.create(null);
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortQueryValue((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }

  return value;
}

/**
 * Examples:
 * generateSearchCacheKey({ category: 'book', quantity: { gte: '1' } })
 *   => 'product_search:v2:2104a62f34a160f0e3b1ea929f942bd2'
 * generateSearchCacheKey({ category: 'book', quantity: { gte: '10' } })
 *   => 'product_search:v2:5b5e456807b103eb7baac29cea142680'
 * Reordering category and quantity in the first input produces the first key again.
 */
function generateSearchCacheKey(query: unknown): string {
  // ProductAPIFeature can use filters beyond a fixed list (for example, quantity).
  // Hash the whole query so requests that can return different data get different keys.
  const keyString = JSON.stringify(sortQueryValue(query));
  // The hash keeps Redis keys short; it is an identifier, not a security check.
  const hash = crypto.createHash("md5").update(keyString).digest("hex");
  // v2 prevents reads of entries created by the old, incomplete key generator.
  return `product_search:v2:${hash}`;
}

function shouldCache(query: any): boolean {
  // Cache search queries and specific high-value filter combinations
  if (query.search && typeof query.search === "string" && query.search.trim().length > 0) {
    return true;
  }

  // Optionally cache popular category/filter combinations
  if (query.category && !query.nextKey && !query.prevKey) {
    return true;
  }

  // Cache first page of any filtered results (no pagination keys)
  if (!query.nextKey && !query.prevKey && !query.search) {
    // Check if there are meaningful filters applied
    const hasFilters = Object.keys(query).some(
      (key) => !["limit", "sort", "fields", "page"].includes(key),
    );
    return hasFilters;
  }

  return false;
}

export { generateSearchCacheKey, shouldCache };
