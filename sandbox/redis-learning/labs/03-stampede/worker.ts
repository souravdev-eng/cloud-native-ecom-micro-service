import { connect, createBarrier, createSlowStore, withPrefix, type WorkerContext } from '../../lib';

export interface StampedeJob {
  variant: 'broken' | 'fixed';
  readersPerWorker: number;
}

/** Each process owns its own map. Redis shares cached answers, not in-flight promises. */
export default async function readHotKey(job: StampedeJob, ctx: WorkerContext): Promise<string[]> {
  const lab = withPrefix('03');
  const redis = await connect();
  const store = createSlowStore(redis, lab.key('db'), { latencyMs: 200 });
  const key = lab.key('cache', 'kindle');
  const inFlight = new Map<string, Promise<string>>();
  try {
    const cached = await Promise.all(Array.from({ length: job.readersPerWorker }, () => redis.get(key)));
    // Hold every miss before any refill: a slow startup must not hide the stampede.
    await createBarrier(redis, lab.key('misses'), ctx.workers).wait();

    async function refill(): Promise<string> {
      const fresh = await store.load('kindle');
      if (fresh === null) throw new Error('the seeded product is missing');
      await redis.set(key, fresh, { EX: 5 });
      return fresh;
    }

    return await Promise.all(cached.map(async (value) => {
      if (value !== null) return value;
      if (job.variant === 'broken') return refill();
      const pending = inFlight.get(key);
      if (pending) return pending;
      const load = refill();
      inFlight.set(key, load);
      try {
        return await load;
      } finally {
        // Remove successful and failed loads so the next miss can try again.
        inFlight.delete(key);
      }
    }));
  } finally {
    await redis.quit();
  }
}
