import type { LabClient } from './connect';

/** Exactly one lab's namespace, e.g. `lab:00:`. Anything wider is refused by cleanup(). */
const LAB_PREFIX = /^lab:\d{2}:$/;

export interface LabKeys {
  prefix: string;
  key: (...parts: Array<string | number>) => string;
}

/**
 * Every lab writes under its own `lab:NN:` prefix, so labs can't see or
 * clobber each other's keys, and cleanup can be scoped to one lab.
 */
export function withPrefix(lab: string): LabKeys {
  if (!/^\d{2}$/.test(lab)) throw new Error(`withPrefix needs a two-digit lab number, got "${lab}"`);
  const prefix = `lab:${lab}:`;
  return { prefix, key: (...parts) => prefix + parts.join(':') };
}

/**
 * Walks the keys under `prefix`. SCAN returns a small batch per call, so
 * Redis keeps serving other clients in between, unlike KEYS, which blocks
 * the server until it has checked every key.
 */
async function* scanPrefix(client: LabClient, prefix: string): AsyncGenerator<string> {
  yield* client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 });
}

/** Counts the keys under `prefix` without blocking the server. */
export async function countKeys(client: LabClient, prefix: string): Promise<number> {
  let count = 0;
  for await (const _key of scanPrefix(client, prefix)) count++;
  return count;
}

/**
 * Deletes every key under one lab's prefix and returns how many went. This
 * is the only cleanup labs use: FLUSHDB and FLUSHALL would wipe keys that
 * aren't theirs. UNLINK frees the memory in a background thread, so a big
 * delete doesn't stall the server the way DEL can.
 */
export async function cleanup(client: LabClient, prefix: string): Promise<number> {
  if (!LAB_PREFIX.test(prefix)) throw new Error(`cleanup needs one lab's prefix like "lab:00:", got "${prefix}"`);
  let removed = 0;
  let batch: string[] = [];
  for await (const key of scanPrefix(client, prefix)) {
    batch.push(key);
    if (batch.length === 100) {
      removed += await client.unlink(batch);
      batch = [];
    }
  }
  if (batch.length) removed += await client.unlink(batch);
  return removed;
}
