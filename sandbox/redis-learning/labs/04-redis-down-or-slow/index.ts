import { performance } from 'node:perf_hooks';
import { parseArgs } from 'node:util';
import { cleanup, connect, countKeys, heading, line, verdict, withPrefix, type LabClient } from '../../lib';

const lab = withPrefix('04');
const API = 'http://127.0.0.1:8474';
const PROXY = 'lesson-04';
const PROXY_PATH = `/proxies/${PROXY}`;
const DELAY_MS = 2000;
const TIMEOUT_MS = 100;
const STORE_MS = 20;
const REQUESTS = 3;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(method: string, path: string, body?: unknown): Promise<void> {
  const response = await fetch(`${API}${path}`, {
    method, signal: AbortSignal.timeout(3000),
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Toxiproxy ${method} ${path}: ${response.status} ${await response.text()}`);
}

/** Bounds the wait, not Redis execution. Only use for this read-only cache GET. */
async function cacheGet(redis: LabClient, key: string): Promise<string | null> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      redis.get(key),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('cache command deadline exceeded')), TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function run(variant: 'broken' | 'fixed') {
  // Direct connection is reserved for setup and cleanup, never timed requests.
  const direct = await connect('redis://127.0.0.1:6390');
  let proxied: LabClient | undefined;
  let proxyCreated = false;
  let watchdog: NodeJS.Timeout | undefined;
  try {
    await cleanup(direct, lab.prefix);
    await direct.set(lab.key('cache', 'kindle'), '149', { EX: 60 });
    await api('POST', '/proxies', {
      name: PROXY, listen: '0.0.0.0:6391', upstream: 'lab-redis:6379', enabled: true,
    });
    proxyCreated = true;
    // Finish connection setup before adding latency: we measure GET, not the handshake.
    proxied = await connect('redis://127.0.0.1:6391');
    await api('POST', `${PROXY_PATH}/toxics`, {
      name: 'slow-replies', type: 'latency', stream: 'downstream', toxicity: 1,
      attributes: { latency: DELAY_MS, jitter: 0 },
    });
    const redis = proxied;
    // Harness deadline only. Broken requests deliberately have no command timeout.
    watchdog = setTimeout(() => { void redis.disconnect(); }, 15000);
    let loads = 0;
    const store = new Map([['kindle', '149']]); // independent system of record
    const times: number[] = [];
    const sources: string[] = [];
    const answers: Array<string | null | undefined> = [];
    heading(variant === 'broken' ? 'Broken: wait for every cache reply' : 'Fixed: stop waiting, read the store');
    line('injected delay', `${DELAY_MS} ms (replies only)`);
    line('command deadline', variant === 'broken' ? 'none' : `${TIMEOUT_MS} ms`);
    for (let i = 0; i < REQUESTS; i++) {
      const start = performance.now();
      let answer: string | null | undefined;
      let source = 'cache';
      if (variant === 'broken') {
        answer = await redis.get(lab.key('cache', 'kindle'));
      } else {
        try {
          answer = await cacheGet(redis, lab.key('cache', 'kindle'));
        } catch {
          answer = null;
        }
        if (answer === null) {
          source = 'fallback';
          loads++;
          await sleep(STORE_MS);
          answer = store.get('kindle');
          // Do not wait for a cache fill on this degraded request path.
        }
      }
      const elapsed = performance.now() - start;
      times.push(elapsed);
      sources.push(source);
      answers.push(answer);
      line(`request ${i + 1}`, `${Math.round(elapsed)} ms · ${source} · price ${answer}`);
    }
    line('store loads', loads);
    return { times, sources, answers, loads };
  } finally {
    clearTimeout(watchdog);
    // A response deadline doesn't cancel an in-flight GET. Close this dedicated
    // lab connection to discard outstanding reads; QUIT would queue behind them.
    try {
      if (proxied?.isOpen) await proxied.disconnect();
    } finally {
      try {
        if (proxyCreated) await api('DELETE', PROXY_PATH); // also removes its latency toxic
      } finally {
        try {
          await cleanup(direct, lab.prefix);
          if (await countKeys(direct, lab.prefix) !== 0) throw new Error('lab keys remain');
        } finally {
          await direct.quit();
        }
      }
    }
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({ options: {
    broken: { type: 'boolean' }, fixed: { type: 'boolean' }, check: { type: 'boolean' },
  } });
  if ([values.broken, values.fixed, values.check].filter(Boolean).length !== 1) {
    throw new Error('Usage: npm run lab:04 -- --broken | --fixed | --check');
  }
  if (!values.check) {
    await run(values.broken ? 'broken' : 'fixed');
    return;
  }
  const broken = await run('broken');
  const fixed = await run('fixed');
  const claims: Array<[string, boolean]> = [
    ['broken: every request >= 2 s', broken.times.every((ms) => ms >= DELAY_MS)],
    // Allow scheduling noise; stay far below the injected two-second delay.
    ['fixed: every request < 500 ms', fixed.times.every((ms) => ms < TIMEOUT_MS + STORE_MS + 380)],
    ['broken: cache, zero store loads', broken.sources.every((s) => s === 'cache') && broken.loads === 0],
    ['fixed: fallback for all 3 reads', fixed.sources.every((s) => s === 'fallback') && fixed.loads === REQUESTS],
    ['both: every price is 149', [...broken.answers, ...fixed.answers].every((value) => value === '149')],
  ];
  const proxies = await fetch(`${API}/proxies`, { signal: AbortSignal.timeout(3000) });
  if (!proxies.ok) throw new Error(`Toxiproxy cleanup check: ${proxies.status}`);
  claims.push(['cleanup: proxy and toxic removed', !Object.hasOwn(await proxies.json() as Record<string, unknown>, PROXY)]);
  heading('Check');
  claims.forEach(([claim, ok]) => verdict(claim, ok ? 'yes' : 'no', ok));
  process.exitCode = claims.every(([, ok]) => ok) ? 0 : 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
