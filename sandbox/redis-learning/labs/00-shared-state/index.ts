import path from 'node:path';
import { parseArgs } from 'node:util';
import { cleanup, connect, countKeys, heading, line, runConcurrently, verdict, withPrefix } from '../../lib';
import type { IncrementJob } from './worker';

/**
 * Lab 00: three worker processes add 1 to one shared counter, 1,000 times
 * each. The broken variant uses GET then SET; the fixed one uses INCR.
 *
 *   npm run lab:00 -- --broken     lose updates
 *   npm run lab:00 -- --fixed      lose none
 *   npm run lab:00 -- --check      run both and assert the outcomes
 *
 * Options: --workers N, --increments N, --no-barrier (leave timing to luck).
 */
const lab = withPrefix('00');
const WORKER = path.join(__dirname, 'worker.ts');
const USAGE = 'Usage: npm run lab:00 -- --broken | --fixed | --check  [--workers N] [--increments N] [--no-barrier]\n'
  + 'Pick exactly one of --broken, --fixed or --check; N must be a whole number of at least 1.';

interface Outcome {
  expected: number;
  actual: number;
  lost: number;
  leftoverKeys: number;
}

async function run(variant: IncrementJob['variant'], workers: number, increments: number, forceRace: boolean): Promise<Outcome> {
  const redis = await connect();
  try {
    await cleanup(redis, lab.prefix);
    const counterKey = lab.key('counter');
    await redis.set(counterKey, '0');

    heading(`${variant === 'broken' ? 'Broken: GET + SET' : 'Fixed: INCR'} · ${workers} processes × ${increments} increments${forceRace ? '' : ' · no barrier'}`);
    await runConcurrently<IncrementJob, void>(workers, WORKER, {
      variant, increments, counterKey, barrierKey: lab.key('barrier'), forceRace,
    });

    const expected = workers * increments;
    const actual = Number(await redis.get(counterKey));
    const lost = expected - actual;
    line('expected', expected);
    line('counter', actual);
    verdict('lost updates', lost, lost === 0);

    await cleanup(redis, lab.prefix);
    return { expected, actual, lost, leftoverKeys: await countKeys(redis, lab.prefix) };
  } finally {
    await redis.quit();
  }
}

/** Runs both variants with forced timing and checks the claims Lesson 0 makes about them. */
async function check(workers: number, increments: number): Promise<boolean> {
  const broken = await run('broken', workers, increments, true);
  const fixed = await run('fixed', workers, increments, true);
  const claims: Array<[string, boolean]> = [
    ['broken variant loses updates', broken.lost > 0],
    ['fixed variant loses none', fixed.lost === 0],
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
      'no-barrier': { type: 'boolean' },
      workers: { type: 'string', default: '3' },
      increments: { type: 'string', default: '1000' },
    },
  });
  const workers = Number(values.workers);
  const increments = Number(values.increments);
  const forceRace = !values['no-barrier'];
  const modes = [values.broken, values.fixed, values.check].filter(Boolean).length;
  const valid = Number.isInteger(workers) && workers >= 1 && Number.isInteger(increments) && increments >= 1;

  if (modes !== 1 || !valid) {
    console.log(USAGE);
    process.exitCode = 1;
  } else if (values.check) {
    process.exitCode = (await check(workers, increments)) ? 0 : 1;
  } else {
    await run(values.broken ? 'broken' : 'fixed', workers, increments, forceRace);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
