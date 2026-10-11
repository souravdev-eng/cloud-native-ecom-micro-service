import path from 'node:path';
import { parseArgs } from 'node:util';
import { cleanup, connect, countKeys, createSlowStore, heading, line, runConcurrently, verdict, withPrefix } from '../../lib';
import { createShop, type PriceRead, type Shop, type Variant } from './shop';
import type { RaceJob } from './worker';

/**
 * Lab 02: a shopper's page view misses the cache and loads the Kindle's
 * price from a slow store. While it's loading, a seller drops the price and
 * invalidates the cache. Then the shopper's pod saves the price it loaded.
 *
 *   npm run lab:02 -- --broken     the old price stays cached until the TTL
 *   npm run lab:02 -- --fixed      a generation number keeps it from being read
 *   npm run lab:02 -- --check      run both and assert the outcomes
 *
 * Options: --ttl N (seconds, default 5), --no-pause (leave the timing to luck).
 */
const lab = withPrefix('02');
const WORKER = path.join(__dirname, 'worker.ts');
const USAGE = 'Usage: npm run lab:02 -- --broken | --fixed | --check  [--ttl N] [--no-pause]\n'
  + 'Pick exactly one of --broken, --fixed or --check; N must be a whole number of seconds, at least 1.';

const PRODUCT = 'kindle';
const OLD_PRICE = '149';
const NEW_PRICE = '129';
/** Long enough that the reader's load is plainly still running when the writer starts. */
const LATENCY_MS = 200;

interface Outcome {
  /** What the next shopper saw straight after the race. */
  nextShopper: PriceRead;
  /** What the store held at that moment. */
  truth: string | null;
  /** Seconds until the next shopper saw the new price, or null if it was never checked. */
  freshAfter: number | null;
  /** Fixed variant only: the copy left under edition 0, which proves the race really happened. */
  oldCopy: string | null;
  leftoverKeys: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const show = (read: PriceRead) => `${read.price} (from ${read.from})`;

async function run(variant: Variant, ttlSeconds: number, forceRace: boolean, waitForFresh: boolean): Promise<Outcome> {
  const redis = await connect();
  try {
    await cleanup(redis, lab.prefix);
    const store = createSlowStore(redis, lab.key('db'), { latencyMs: LATENCY_MS });
    const shop = createShop(redis, store, lab, variant, ttlSeconds);
    await store.save(PRODUCT, OLD_PRICE);

    const title = variant === 'broken' ? 'Broken: delete the key on write' : 'Fixed: bump the edition number on write';
    heading(`${title} · TTL ${ttlSeconds}s${forceRace ? '' : ' · no pause'}`);
    line('store before', OLD_PRICE);

    const [reader] = await runConcurrently<RaceJob, PriceRead | null>(2, WORKER, {
      variant, productId: PRODUCT, newPrice: NEW_PRICE, ttlSeconds, latencyMs: LATENCY_MS, forceRace,
    });
    line('reader loaded', reader ? show(reader) : 'nothing');
    line('seller set', NEW_PRICE);

    /** The next shopper: a normal page view on a third connection, after the race is over. */
    const nextShopper = await shop.readPrice(PRODUCT);
    const truth = await store.load(PRODUCT);
    line('store now', truth ?? 'nothing');
    line('cache key', await shop.currentKey(PRODUCT));
    verdict('next shopper sees', show(nextShopper), nextShopper.price === truth);

    let oldCopy: string | null = null;
    if (variant === 'fixed') {
      const oldKey = lab.key('cache', PRODUCT, 'g0');
      oldCopy = await redis.get(oldKey);
      if (oldCopy !== null) line('old copy', `${oldKey} = ${oldCopy}, TTL ${await redis.ttl(oldKey)}s, never read again`);
    }

    let freshAfter: number | null = null;
    if (waitForFresh && nextShopper.price !== truth) {
      freshAfter = await watchUntilFresh(shop, truth, ttlSeconds);
    }

    await cleanup(redis, lab.prefix);
    return { nextShopper, truth, freshAfter, oldCopy, leftoverKeys: await countKeys(redis, lab.prefix) };
  } finally {
    await redis.quit();
  }
}

/**
 * Reads the price once a second, as shoppers would, until the stale copy
 * expires and a miss loads the new price. Gives up a few seconds after the
 * TTL, which would mean the copy had no expiry at all.
 */
async function watchUntilFresh(shop: Shop, truth: string | null, ttlSeconds: number): Promise<number | null> {
  heading('Shoppers keep reading, once a second');
  for (let second = 1; second <= ttlSeconds + 3; second++) {
    await sleep(1000);
    const read = await shop.readPrice(PRODUCT);
    verdict(`after ${second}s`, show(read), read.price === truth);
    if (read.price === truth) return second;
  }
  return null;
}

/** Runs both variants with forced timing and checks the claims Lesson 2 makes about them. */
async function check(ttlSeconds: number): Promise<boolean> {
  const broken = await run('broken', ttlSeconds, true, true);
  const fixed = await run('fixed', ttlSeconds, true, false);
  const claims: Array<[string, boolean]> = [
    ['broken: next shopper gets the old price', broken.nextShopper.price === OLD_PRICE && broken.nextShopper.from === 'cache'],
    /** One second of slack either side, because shoppers read once a second. */
    ['broken: stale for the whole TTL, then fresh', broken.freshAfter !== null && Math.abs(broken.freshAfter - ttlSeconds) <= 1],
    ['fixed: the old price was cached under edition 0', fixed.oldCopy === OLD_PRICE],
    ['fixed: next shopper gets the new price', fixed.nextShopper.price === NEW_PRICE && fixed.truth === NEW_PRICE],
    [`no keys left under ${lab.prefix}*`, broken.leftoverKeys === 0 && fixed.leftoverKeys === 0],
  ];
  heading('Check');
  claims.forEach(([claim, ok]) => verdict(claim, ok ? 'yes' : 'no', ok));
  return claims.every(([, ok]) => ok);
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      broken: { type: 'boolean' },
      fixed: { type: 'boolean' },
      check: { type: 'boolean' },
      'no-pause': { type: 'boolean' },
      ttl: { type: 'string' },
    },
  });
  /**
   * The check uses a shorter TTL, because verify runs it three times. Three
   * seconds still leaves two reads that must find the old price.
   */
  const ttlSeconds = Number(values.ttl ?? (values.check ? '3' : '5'));
  const modes = [values.broken, values.fixed, values.check].filter(Boolean).length;
  const valid = Number.isInteger(ttlSeconds) && ttlSeconds >= 1;

  if (modes !== 1 || !valid) {
    console.log(USAGE);
    process.exitCode = 1;
  } else if (values.check) {
    process.exitCode = (await check(ttlSeconds)) ? 0 : 1;
  } else {
    await run(values.broken ? 'broken' : 'fixed', ttlSeconds, !values['no-pause'], true);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
