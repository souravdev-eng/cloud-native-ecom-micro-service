import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connect, type LabClient } from '../connect';
import { cleanup } from '../keys';
import { createSlowStore } from '../slowStore';

/** Lab 95 is reserved for these tests, so they never touch a real lab's keys. */
const prefix = 'lab:95:';

async function sandbox(t: { skip: (msg: string) => void }): Promise<LabClient | null> {
  try {
    return await connect();
  } catch {
    t.skip('sandbox Redis not running (npm run redis:single)');
    return null;
  }
}

test('load returns what save stored, and null for a missing record', async (t) => {
  const client = await sandbox(t);
  if (!client) return;
  try {
    await cleanup(client, prefix);
    const store = createSlowStore(client, `${prefix}db`, { latencyMs: 0 });
    await store.save('kindle', '149');
    assert.equal(await store.load('kindle'), '149');
    assert.equal(await store.load('nope'), null);
  } finally {
    await cleanup(client, prefix);
    await client.quit();
  }
});

test('every load is counted, and saves are not', async (t) => {
  const client = await sandbox(t);
  if (!client) return;
  try {
    await cleanup(client, prefix);
    const store = createSlowStore(client, `${prefix}db`, { latencyMs: 0 });
    assert.equal(await store.loads(), 0);
    await store.save('kindle', '149');
    await Promise.all([store.load('kindle'), store.load('kindle'), store.load('nope')]);
    assert.equal(await store.loads(), 3);
  } finally {
    await cleanup(client, prefix);
    await client.quit();
  }
});

test('a load takes at least latencyMs', async (t) => {
  const client = await sandbox(t);
  if (!client) return;
  try {
    await cleanup(client, prefix);
    const store = createSlowStore(client, `${prefix}db`, { latencyMs: 150 });
    const started = Date.now();
    await store.load('kindle');
    assert.ok(Date.now() - started >= 150, 'load returned before its latency');
  } finally {
    await cleanup(client, prefix);
    await client.quit();
  }
});
