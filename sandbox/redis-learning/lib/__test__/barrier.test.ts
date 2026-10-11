import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createBarrier } from '../barrier';
import { connect, type LabClient } from '../connect';
import { cleanup } from '../keys';
import { runConcurrently } from '../processes';

/** Lab 97 is reserved for these tests, so they never touch a real lab's keys. */
const prefix = 'lab:97:';

async function sandbox(t: { skip: (msg: string) => void }): Promise<LabClient | null> {
  try {
    return await connect();
  } catch {
    t.skip('sandbox Redis not running (npm run redis:single)');
    return null;
  }
}

test('no process passes the barrier until every process has arrived', async (t) => {
  const client = await sandbox(t);
  if (!client) return;
  try {
    await cleanup(client, prefix);
    const rounds = 20;
    const seen = await runConcurrently<{ prefix: string; rounds: number }, number[]>(
      3, path.join(__dirname, 'fixtures', 'barrier-rounds.ts'), { prefix, rounds },
    );
    const expected = Array.from({ length: rounds }, (_, i) => 3 * (i + 1));
    seen.forEach((perWorker) => assert.deepEqual(perWorker, expected));
  } finally {
    await cleanup(client, prefix);
    await client.quit();
  }
});

test('wait() rejects when the other parties never arrive', async (t) => {
  const client = await sandbox(t);
  if (!client) return;
  try {
    const barrier = createBarrier(client, `${prefix}lonely`, 2, { timeoutSeconds: 0.2 });
    await assert.rejects(barrier.wait(), /timed out: 1\/2 arrived/);
  } finally {
    await cleanup(client, prefix);
    await client.quit();
  }
});
