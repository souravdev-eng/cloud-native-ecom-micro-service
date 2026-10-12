import path from 'node:path';
import { parseArgs } from 'node:util';
import { cleanup, connect, countKeys, createSlowStore, heading, line, runConcurrently, verdict, withPrefix, type LabClient } from '../../lib';
import type { StampedeJob } from './worker';

const lab = withPrefix('03');
const WORKERS = 4;
const READERS = 200;
const BATCH = 100;
const BASE_MS = 1500;
const JITTER_MS = 2000;
const BUCKET_MS = 500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Same pseudo-random sample each run, so the teaching histogram is repeatable. */
function jitterSample(): number[] {
  let seed = 3;
  return Array.from({ length: BATCH }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor((seed / 2 ** 32) * JITTER_MS);
  });
}

async function expiries(redis: LabClient, variant: StampedeJob['variant']) {
  const keys = Array.from({ length: BATCH }, (_, i) => lab.key('batch', i));
  const start = Date.now();
  const offsets = variant === 'fixed' ? jitterSample() : Array<number>(BATCH).fill(0);
  await Promise.all(keys.map((key, i) => redis.set(key, 'copy', { PXAT: start + BASE_MS + offsets[i] })));
  // Read the deadlines Redis actually stored, rather than graphing our input.
  const deadlines = await Promise.all(keys.map((key) => redis.pExpireTime(key)));
  const buckets = Array<number>(4).fill(0);
  for (const deadline of deadlines) {
    const bucket = Math.floor((deadline - start - BASE_MS) / BUCKET_MS);
    if (bucket < 0 || bucket >= buckets.length) throw new Error(`unexpected expiry: ${deadline}`);
    buckets[bucket]++;
  }
  heading(variant === 'broken' ? 'Batch: same TTL' : 'Batch: base TTL + 0–1999ms jitter (seed 3)');
  line('keys', BATCH);
  line('expiry after fill', 'each # = about 5 keys');
  buckets.forEach((n, i) => line(`${(BASE_MS + i * BUCKET_MS) / 1000}–${(BASE_MS + (i + 1) * BUCKET_MS) / 1000}s`, `${'#'.repeat(Math.ceil(n / 5))} (${n})`));
  await sleep(Math.max(0, start + BASE_MS + 100 - Date.now()));
  const remaining = await redis.exists(keys);
  line('after base TTL', `${remaining}/${BATCH} keys still readable`);
  return { buckets, remaining, span: Math.max(...deadlines) - Math.min(...deadlines) };
}

async function run(variant: StampedeJob['variant']) {
  const redis = await connect();
  try {
    await cleanup(redis, lab.prefix);
    const store = createSlowStore(redis, lab.key('db'), { latencyMs: 200 });
    await store.save('kindle', '149');
    const key = lab.key('cache', 'kindle');
    await redis.set(key, '149', { PX: 30 });
    await sleep(50);
    if (await redis.get(key) !== null) throw new Error('hot key has not expired');
    heading(variant === 'broken' ? 'Broken: everyone fetches a copy' : 'Fixed: share one fetch inside each worker');
    line('workers', WORKERS);
    line('concurrent readers', READERS);
    const replies = await runConcurrently<StampedeJob, string[]>(WORKERS, path.join(__dirname, 'worker.ts'), {
      variant, readersPerWorker: READERS / WORKERS,
    });
    const loads = await store.loads();
    verdict('store loads', loads, loads === WORKERS);
    const allAnswered = replies.flat().length === READERS && replies.flat().every((value) => value === '149');
    verdict('all readers get 149', allAnswered ? 'yes' : 'no', allAnswered);
    const batch = await expiries(redis, variant);
    return { loads, allAnswered, batch };
  } finally {
    try {
      await cleanup(redis, lab.prefix);
      if (await countKeys(redis, lab.prefix) !== 0) throw new Error('lab keys remain after cleanup');
    } finally {
      await redis.quit();
    }
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({ options: {
    broken: { type: 'boolean' }, fixed: { type: 'boolean' }, check: { type: 'boolean' },
  } });
  if ([values.broken, values.fixed, values.check].filter(Boolean).length !== 1) {
    throw new Error('Usage: npm run lab:03 -- --broken | --fixed | --check');
  }
  if (!values.check) {
    await run(values.broken ? 'broken' : 'fixed');
    return;
  }
  const broken = await run('broken');
  const fixed = await run('fixed');
  const claims: Array<[string, boolean]> = [
    ['broken: 200 loads (all misses forced)', broken.loads === READERS],
    ['fixed: 1 load per worker (4 total)', fixed.loads === WORKERS],
    ['both: all 200 readers get 149', broken.allAnswered && fixed.allAnswered],
    ['same TTL: all 100 expire together', broken.batch.span === 0 && broken.batch.remaining === 0],
    ['jitter: 4 buckets, span >= 1.5s', fixed.batch.buckets.every((n) => n > 0) && fixed.batch.span >= 1500],
    ['jitter: some expired, some remain', fixed.batch.remaining > 0 && fixed.batch.remaining < BATCH],
  ];
  heading('Check');
  claims.forEach(([claim, ok]) => verdict(claim, ok ? 'yes' : 'no', ok));
  process.exitCode = claims.every(([, ok]) => ok) ? 0 : 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
