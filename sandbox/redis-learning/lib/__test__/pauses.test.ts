import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connect, type LabClient } from '../connect';
import { cleanup } from '../keys';
import { createPauses } from '../pauses';

/** Lab 96 is reserved for these tests, so they never touch a real lab's keys. */
const prefix = 'lab:96:';

async function sandbox(t: { skip: (msg: string) => void }): Promise<LabClient | null> {
  try {
    return await connect();
  } catch {
    t.skip('sandbox Redis not running (npm run redis:single)');
    return null;
  }
}

test('a paused worker waits until another worker has done its step and resumed it', async (t) => {
  const reader = await sandbox(t);
  if (!reader) return;
  /** Each side blocks on BLPOP, so each needs its own connection, as two pods would have. */
  const writer = await connect();
  const log: string[] = [];
  try {
    await cleanup(reader, prefix);
    const readerSide = createPauses(reader, `${prefix}pauses`);
    const writerSide = createPauses(writer, `${prefix}pauses`);

    const readerDone = (async () => {
      log.push('reader: loaded');
      await readerSide.pauseAt('loaded');
      log.push('reader: wrote cache');
    })();
    const writerDone = (async () => {
      await writerSide.waitUntilPaused('loaded');
      /** A deliberate delay: if pauseAt didn't hold the reader, it would log first. */
      await new Promise((resolve) => setTimeout(resolve, 100));
      log.push('writer: updated store');
      await writerSide.resume('loaded');
    })();
    await Promise.all([readerDone, writerDone]);

    assert.deepEqual(log, ['reader: loaded', 'writer: updated store', 'reader: wrote cache']);
  } finally {
    await cleanup(reader, prefix);
    await reader.quit();
    await writer.quit();
  }
});

test('pauseAt rejects when nobody resumes it', async (t) => {
  const client = await sandbox(t);
  if (!client) return;
  try {
    const pauses = createPauses(client, `${prefix}lonely`, { timeoutSeconds: 0.2 });
    await assert.rejects(pauses.pauseAt('stuck'), /pauseAt\('stuck'\): nobody called resume/);
  } finally {
    await cleanup(client, prefix);
    await client.quit();
  }
});

test('waitUntilPaused rejects when nobody pauses', async (t) => {
  const client = await sandbox(t);
  if (!client) return;
  try {
    const pauses = createPauses(client, `${prefix}empty`, { timeoutSeconds: 0.2 });
    await assert.rejects(pauses.waitUntilPaused('never'), /nobody paused there/);
  } finally {
    await cleanup(client, prefix);
    await client.quit();
  }
});
