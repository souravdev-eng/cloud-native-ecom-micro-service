import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { runConcurrently } from '../processes';

const fixture = (name: string) => path.join(__dirname, 'fixtures', name);

test('runs each worker in its own process and returns results in index order', async () => {
  const results = await runConcurrently<{ greeting: string }, { pid: number; index: number; workers: number; greeting: string }>(
    3, fixture('report-pid.ts'), { greeting: 'hi' },
  );

  assert.deepEqual(results.map((r) => r.index), [0, 1, 2]);
  assert.ok(results.every((r) => r.workers === 3 && r.greeting === 'hi'));
  const pids = new Set(results.map((r) => r.pid));
  assert.equal(pids.size, 3, 'each worker has its own pid');
  assert.ok(!pids.has(process.pid), 'no worker runs in the parent process');
});

test("rejects with the worker's error when a worker throws", async () => {
  /** Both workers throw, and whichever process exits first decides which one is reported. */
  await assert.rejects(runConcurrently(2, fixture('fail.ts'), {}), /worker [01] failed: worker exploded/);
});
