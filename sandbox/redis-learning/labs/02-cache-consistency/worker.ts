import { connect, createBarrier, createPauses, createSlowStore, withPrefix, type WorkerContext } from '../../lib';
import { createShop, type PriceRead, type Variant } from './shop';

export interface RaceJob {
  variant: Variant;
  productId: string;
  newPrice: string;
  ttlSeconds: number;
  latencyMs: number;
  /** Off with --no-pause: both workers still start together, but who goes first is left to luck. */
  forceRace: boolean;
}

/** The step where the reader has loaded the old price but not yet saved its copy. */
const LOADED = 'reader-loaded';

/**
 * Two "pods". Worker 0 is a shopper whose page view misses the cache; worker
 * 1 is a seller changing the price. With forceRace, the reader is held right
 * after loading from the store, while the writer does its whole update.
 */
export default async function race(job: RaceJob, ctx: WorkerContext): Promise<PriceRead | null> {
  const lab = withPrefix('02');
  const redis = await connect();
  const store = createSlowStore(redis, lab.key('db'), { latencyMs: job.latencyMs });
  const shop = createShop(redis, store, lab, job.variant, job.ttlSeconds);
  const pauses = createPauses(redis, lab.key('pauses'));
  try {
    /** A starting line, so neither worker begins before the other is ready. */
    await createBarrier(redis, lab.key('barrier'), ctx.workers).wait();

    if (ctx.index === 0) {
      return await shop.readPrice(job.productId, job.forceRace ? () => pauses.pauseAt(LOADED) : undefined);
    }

    if (job.forceRace) await pauses.waitUntilPaused(LOADED);
    await shop.changePrice(job.productId, job.newPrice);
    if (job.forceRace) await pauses.resume(LOADED);
    return null;
  } finally {
    await redis.quit();
  }
}
