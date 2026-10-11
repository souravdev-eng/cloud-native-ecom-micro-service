import type { LabClient } from './connect';

/**
 * A fake system of record (the "filing room" in the lessons) for labs that
 * need a database behind the cache. Every load and save waits `latencyMs`
 * first, standing in for the walk to MongoDB, and every load is counted.
 *
 * It's kept in the sandbox Redis, under the lab's own prefix, so every
 * worker process sees the same store and the same load count. Labs must
 * treat it as the database, never as cache: only load() and save() touch it.
 *
 *   const store = createSlowStore(redis, lab.key('db'), { latencyMs: 200 });
 *   await store.save('kindle', '149');
 *   await store.load('kindle');   // '149', after 200 ms
 *   await store.loads();          // 1
 */
export interface SlowStore {
  /** Reads one record, or null if there's none. Counts as one load. */
  load(id: string): Promise<string | null>;
  /** Writes one record. Not counted as a load. */
  save(id: string, value: string): Promise<void>;
  /** How many load() calls have run so far, across every process. */
  loads(): Promise<number>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createSlowStore(client: LabClient, key: string, { latencyMs = 100 } = {}): SlowStore {
  /** One hash holds every record (field = id); a separate counter holds the load count. */
  const loadsKey = `${key}:loads`;
  return {
    async load(id) {
      await sleep(latencyMs);
      const [value] = await client.multi().hGet(key, id).incr(loadsKey).exec();
      return (value as string | null) ?? null;
    },
    async save(id, value) {
      await sleep(latencyMs);
      await client.hSet(key, id, value);
    },
    async loads() {
      return Number(await client.get(loadsKey));
    },
  };
}
