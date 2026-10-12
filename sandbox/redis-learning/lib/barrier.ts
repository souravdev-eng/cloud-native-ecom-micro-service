import type { LabClient } from './connect';

/** A safety net: a crashed lab leaves its barrier keys behind for at most this long. */
const KEY_TTL_SECONDS = 60;

export interface Barrier {
  /** Resolves once all parties have called wait() for the same round. */
  wait(): Promise<void>;
}

/**
 * A barrier shared by separate processes, built on the sandbox Redis.
 *
 * Labs use it to force the worst-case timing on every run: each worker
 * reads, then waits here, so all of them hold the same stale value before
 * any of them writes. Without it a race lab might pass by luck.
 *
 * Each round, every party INCRs an arrival counter. The last to arrive
 * pushes one release token per waiting party; the others block on BLPOP
 * until their token comes. Every party must call wait() the same number of
 * times, because rounds are matched by call count.
 */
export function createBarrier(
  client: LabClient,
  key: string,
  parties: number,
  { timeoutSeconds = 10 } = {},
): Barrier {
  let round = 0;
  return {
    async wait() {
      const arrivedKey = `${key}:${round}:arrived`;
      const releaseKey = `${key}:${round}:release`;
      round++;

      const [arrived] = await client.multi().incr(arrivedKey).expire(arrivedKey, KEY_TTL_SECONDS).exec();
      if (Number(arrived) === parties) {
        await client.unlink(arrivedKey);
        if (parties > 1) {
          const tokens = Array.from({ length: parties - 1 }, () => 'go');
          await client.multi().rPush(releaseKey, tokens).expire(releaseKey, KEY_TTL_SECONDS).exec();
        }
        return;
      }

      const released = await client.blPop(releaseKey, timeoutSeconds);
      if (!released) throw new Error(`barrier ${key} timed out: ${arrived}/${parties} arrived`);
    },
  };
}
