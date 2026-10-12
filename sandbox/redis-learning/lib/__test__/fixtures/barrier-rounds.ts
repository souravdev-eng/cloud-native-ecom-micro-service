import { createBarrier } from '../../barrier';
import { connect } from '../../connect';
import type { WorkerContext } from '../../processes';

/**
 * Each round, every worker counts itself in, then waits at the barrier. If
 * the barrier works, nobody gets past it before all workers have counted
 * in, so everyone reads exactly `workers × round` afterwards.
 */
export default async function barrierRounds(input: { prefix: string; rounds: number }, ctx: WorkerContext) {
  const client = await connect();
  const barrier = createBarrier(client, `${input.prefix}barrier`, ctx.workers);
  const seen: number[] = [];
  try {
    for (let round = 1; round <= input.rounds; round++) {
      await client.incr(`${input.prefix}arrived`);
      await barrier.wait();
      seen.push(Number(await client.get(`${input.prefix}arrived`)));
      /** A second barrier stops a fast worker counting in for the next round before the others have read. */
      await barrier.wait();
    }
    return seen;
  } finally {
    await client.quit();
  }
}
