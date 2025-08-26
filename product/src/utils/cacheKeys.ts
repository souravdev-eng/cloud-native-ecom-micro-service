import crypto from 'crypto';

function generateSearchCacheKey(query: any): string {
  const searchParams = {
    search: query.search,
    limit: query.limit || 20,
    page: query.page || 1,
    sort: query.sort,
    fields: query.fields,
    // Include filters that might be commonly used with search
    category: query.category,
    price: query.price,
    brand: query.brand,
  } as Record<string, string | number>;

  // Remove undefined values
  Object.keys(searchParams).forEach((key) => {
    if (searchParams[key] === undefined) {
      delete searchParams[key];
    }
  });

  const keyString = JSON.stringify(searchParams);
  const hash = crypto.createHash('md5').update(keyString).digest('hex');
  return `product_search:${hash}`;
}

function shouldCache(query: any): boolean {
  // Cache search queries and specific high-value filter combinations
  if (query.search && typeof query.search === 'string' && query.search.trim().length > 0) {
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
      (key) => !['limit', 'sort', 'fields', 'page'].includes(key)
    );
    return hasFilters;
  }

  return false;
}

export { generateSearchCacheKey, shouldCache };
