import type { LabClient, LabKeys, SlowStore } from '../../lib';

export type Variant = 'broken' | 'fixed';

export interface PriceRead {
  price: string | null;
  from: 'cache' | 'store';
}

/**
 * The shop's price code, as every "pod" in the lab runs it: cache-aside
 * reads, and writes that update the store and then invalidate the cache.
 *
 * broken: one key per product, and a write deletes it, as product does today.
 * fixed:  the key carries a generation number, and a write bumps the number
 *         instead of deleting. A copy saved under an old number is never read.
 */
export interface Shop {
  /** The optional afterLoad step runs between loading from the store and saving the copy: where the lab pauses the reader. */
  readPrice(id: string, afterLoad?: () => Promise<void>): Promise<PriceRead>;
  changePrice(id: string, price: string): Promise<void>;
  /** The key a read would use right now, for printing. */
  currentKey(id: string): Promise<string>;
}

export function createShop(redis: LabClient, store: SlowStore, lab: LabKeys, variant: Variant, ttlSeconds: number): Shop {
  const genKey = (id: string) => lab.key('gen', id);

  /**
   * The fixed variant reads the generation first, then builds the key from
   * it. A product never changed has no counter yet, which reads as 0.
   */
  const currentKey = async (id: string) => {
    if (variant === 'broken') return lab.key('cache', id);
    const gen = Number(await redis.get(genKey(id)));
    return lab.key('cache', id, `g${gen}`);
  };

  return {
    currentKey,

    async readPrice(id, afterLoad) {
      const key = await currentKey(id);
      const cached = await redis.get(key);
      if (cached !== null) return { price: cached, from: 'cache' };

      const price = await store.load(id);
      if (afterLoad) await afterLoad();
      /** The copy and its TTL in one command, as product's routes do. */
      if (price !== null) await redis.set(key, price, { EX: ttlSeconds });
      return { price, from: 'store' };
    },

    async changePrice(id, price) {
      /** Store first, cache second: invalidating before the write commits would let a reader re-cache the old price. */
      await store.save(id, price);
      if (variant === 'broken') {
        await redis.del(lab.key('cache', id));
      } else {
        await redis.incr(genKey(id));
      }
    },
  };
}
