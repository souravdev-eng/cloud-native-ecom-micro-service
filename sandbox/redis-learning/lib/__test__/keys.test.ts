import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connect, type LabClient } from '../connect';
import { cleanup, countKeys, withPrefix } from '../keys';

test('withPrefix builds keys under lab:NN:', () => {
  const lab = withPrefix('00');
  assert.equal(lab.prefix, 'lab:00:');
  assert.equal(lab.key('counter'), 'lab:00:counter');
  assert.equal(lab.key('barrier', 3), 'lab:00:barrier:3');
});

test('withPrefix rejects anything but a two-digit lab number', () => {
  for (const bad of ['', '0', '000', 'ab', '0*']) {
    assert.throws(() => withPrefix(bad), /two-digit lab number/);
  }
});

/** A wider pattern such as `*` or `lab:` would delete other labs' keys, or everything. */
test('cleanup refuses a prefix that is not exactly one lab', async () => {
  const fake = {} as LabClient;
  for (const bad of ['', '*', 'lab:', 'lab:*', 'product:', 'lab:00']) {
    await assert.rejects(cleanup(fake, bad), /one lab's prefix/);
  }
});

test('cleanup removes only keys under its own prefix', async (t) => {
  let client: LabClient;
  try {
    client = await connect();
  } catch {
    t.skip('sandbox Redis not running (npm run redis:single)');
    return;
  }
  const mine = withPrefix('98');
  const keep = 'lab:99:keep';
  try {
    await client.set(keep, '1');
    for (let i = 0; i < 250; i++) await client.set(mine.key('item', i), String(i));

    const removed = await cleanup(client, mine.prefix);

    assert.equal(removed, 250);
    assert.equal(await countKeys(client, mine.prefix), 0);
    assert.equal(await client.get(keep), '1');
  } finally {
    /** Raw keys here, so a broken helper can't stop the client closing and leave the test run hanging. */
    await client.del(keep);
    await client.quit();
  }
});
