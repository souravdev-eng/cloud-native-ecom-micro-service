import { generateSearchCacheKey, shouldCache } from '../cacheKeys';

describe('generateSearchCacheKey', () => {
  it('uses different keys for different quantity bounds', () => {
    const atLeastOne = generateSearchCacheKey({
      category: 'book',
      quantity: { gte: '1' },
    });
    const atLeastTen = generateSearchCacheKey({
      category: 'book',
      quantity: { gte: '10' },
    });

    expect(atLeastOne).not.toBe(atLeastTen);
  });

  it('uses the same key for equivalent queries regardless of property order', () => {
    const first = generateSearchCacheKey({
      category: 'book',
      quantity: { gte: '1', lte: '10' },
      price: { gt: '100', lt: '500' },
    });
    const reordered = generateSearchCacheKey({
      price: { lt: '500', gt: '100' },
      quantity: { lte: '10', gte: '1' },
      category: 'book',
    });

    expect(first).toBe(reordered);
    expect(first).toMatch(/^product_search:v2:/);
  });

  it.each(['sort', 'fields', 'limit', 'page'])(
    'uses different keys when %s changes',
    (field) => {
      const base = { category: 'book', [field]: '1' };
      const changed = { category: 'book', [field]: '2' };
      expect(generateSearchCacheKey(base)).not.toBe(generateSearchCacheKey(changed));
    },
  );

  it('includes extra filters on search queries that are cached', () => {
    const first = { search: 'phone', quantity: { gte: '1' } };
    const second = { search: 'phone', quantity: { gte: '10' } };
    expect(shouldCache(first)).toBe(true);
    expect(shouldCache(second)).toBe(true);
    expect(generateSearchCacheKey(first)).not.toBe(generateSearchCacheKey(second));
  });

  it('preserves array order', () => {
    expect(generateSearchCacheKey({ tags: ['a', 'b'] })).not.toBe(
      generateSearchCacheKey({ tags: ['b', 'a'] }),
    );
  });
});
