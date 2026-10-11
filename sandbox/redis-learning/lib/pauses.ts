import type { LabClient } from './connect';

/** A safety net: a crashed lab leaves its pause keys behind for at most this long. */
const KEY_TTL_SECONDS = 60;

/**
 * Named pause points shared by separate processes, for forcing one exact
 * order of events. Where the barrier lines everyone up, a pause holds one
 * worker at one step while another worker does something in between:
 *
 *   reader:  await pauses.pauseAt('loaded');          // stops here
 *   writer:  await pauses.waitUntilPaused('loaded');  // until the reader stops
 *            ...update the store, delete the key...
 *            await pauses.resume('loaded');           // reader carries on
 *
 * Each step is used by one paused worker, once per run. A waiting call
 * blocks its connection (BLPOP), so the two sides of a step must use
 * different connections, as two worker processes do.
 */
export interface Pauses {
  /** Says "I'm here", then waits until another worker calls resume(step). */
  pauseAt(step: string): Promise<void>;
  /** Waits until a worker is held at `step`. */
  waitUntilPaused(step: string): Promise<void>;
  /** Lets the worker held at `step` carry on. */
  resume(step: string): Promise<void>;
}

export function createPauses(client: LabClient, key: string, { timeoutSeconds = 10 } = {}): Pauses {
  const pausedKey = (step: string) => `${key}:${step}:paused`;
  const goKey = (step: string) => `${key}:${step}:go`;

  /** Each signal is one list item, pushed with its expiry in one MULTI so it can't be left without one. */
  const signal = async (listKey: string) => {
    await client.multi().rPush(listKey, '1').expire(listKey, KEY_TTL_SECONDS).exec();
  };
  const awaitSignal = async (listKey: string, what: string) => {
    const got = await client.blPop(listKey, timeoutSeconds);
    if (!got) throw new Error(`${what} timed out after ${timeoutSeconds}s`);
  };

  return {
    async pauseAt(step) {
      await signal(pausedKey(step));
      await awaitSignal(goKey(step), `pauseAt('${step}'): nobody called resume`);
    },
    async waitUntilPaused(step) {
      await awaitSignal(pausedKey(step), `waitUntilPaused('${step}'): nobody paused there`);
    },
    async resume(step) {
      await signal(goKey(step));
    },
  };
}
