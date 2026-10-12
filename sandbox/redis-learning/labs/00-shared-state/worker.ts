import { connect, createBarrier, type WorkerContext } from '../../lib';

export interface IncrementJob {
  variant: 'broken' | 'fixed';
  increments: number;
  counterKey: string;
  barrierKey: string;
  /** Off with --no-barrier: the workers still start together, but the race timing is left to luck. */
  forceRace: boolean;
}

/** One "pod": its own process, its own connection, adding 1 to the shared counter `increments` times. */
export default async function increment(job: IncrementJob, ctx: WorkerContext): Promise<void> {
  const redis = await connect();
  const barrier = createBarrier(redis, job.barrierKey, ctx.workers);
  try {
    /** A starting line, so no worker finishes before the others have begun. */
    await barrier.wait();

    for (let i = 0; i < job.increments; i++) {
      if (job.variant === 'broken') {
        /** Read-modify-write in two round trips. Other workers' commands can run in the gap. */
        const current = Number(await redis.get(job.counterKey));
        if (job.forceRace) await barrier.wait();
        await redis.set(job.counterKey, String(current + 1));
      } else {
        /** One command. Redis runs it start to finish before any other command. */
        if (job.forceRace) await barrier.wait();
        await redis.incr(job.counterKey);
      }
    }
  } finally {
    await redis.quit();
  }
}
