import { fork, execFile, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { promisify, parseArgs } from 'node:util';
import { setTimeout as sleep } from 'node:timers/promises';
import { cleanup, connect, countKeys, heading, line, verdict, withPrefix } from '../../lib';
import type { Notice, Variant, WorkerMessage } from './worker';

const lab = withPrefix('05');
const ps = promisify(execFile);
const abort = new AbortController();
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => abort.abort(new Error(`interrupted by ${signal}`)));
}

async function run(variant: Variant) {
  const redis = await connect();
  const children: ChildProcess[] = [];
  const closed: Promise<void>[] = [];
  const releases: Array<number | null> = [];
  const notices = new Set<string>();
  const waiters = new Map<string, () => void>();
  let fail!: (error: Error) => void;
  const failure = new Promise<never>((_, reject) => { fail = reject; });
  // A failure can arrive between waits; retain it without an unhandled rejection.
  void failure.catch(() => {});
  const onAbort = () => fail(abort.signal.reason);
  abort.signal.addEventListener('abort', onAbort, { once: true });
  const deadline = setTimeout(() => fail(new Error(`${variant}: workers timed out`)), 20000);
  const wait = (index: number, event: Notice | 'closed') => Promise.race([
    new Promise<void>((resolve) => {
      const key = `${index}:${event}`;
      if (notices.has(key)) resolve();
      else waiters.set(key, resolve);
    }), failure,
  ]);
  const record = (index: number, event: Notice | 'closed') => {
    const key = `${index}:${event}`;
    notices.add(key);
    waiters.get(key)?.();
    waiters.delete(key);
  };
  const go = (index: number, event: Notice) => children[index].send({ type: 'go', event });

  // Independent fake data store, reached over IPC. No Redis lock check here.
  // Each request is one synchronous turn: fence validation + mutation, or
  // quantity predicate + decrement, cannot be interleaved with another write.
  let stock = 1;
  let accepted = 0;
  let staleRejected = 0;
  let lastFence = 0;
  let stopped = false;
  let pausedMs = 0;
  function start(index: number) {
    const child = fork(path.join(__dirname, 'worker.ts'), [], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
    children[index] = child;
    let done = false;
    child.on('error', fail);
    child.on('message', (message: WorkerMessage) => {
      if (message.type === 'error') return fail(new Error(message.error));
      if (message.type === 'notice') return record(index, message.event);
      if (message.type === 'done') {
        done = true;
        releases[index] = message.release;
        return;
      }
      let value = stock;
      if (message.operation === 'buy') {
        value = stock >= 1 ? 1 : 0;
        if (value) { stock--; accepted++; }
      } else if (message.operation === 'write') {
        if (variant === 'fenced' && (message.fence ?? 0) <= lastFence) {
          staleRejected++;
          value = 0;
        } else {
          lastFence = message.fence ?? 0;
          stock = message.quantity!;
          accepted++;
          value = 1;
        }
      }
      child.send({ type: 'response', id: message.id, value });
    });
    closed[index] = new Promise((resolve) => child.once('close', (code, signal) => {
      if (!done || code !== 0) fail(new Error(`worker ${index} exited (${signal ?? code}) before successful completion`));
      record(index, 'closed');
      resolve();
    }));
    child.send({ variant, index });
  }
  try {
    abort.signal.throwIfAborted();
    await cleanup(redis, lab.prefix);
    heading({ broken: 'A: no protection', lock: 'B: token-checked lease, happy path', paused: 'C: holder stopped past TTL', fenced: 'D: data store rejects old fence', atomic: 'E: atomic conditional decrement, no lock' }[variant]);
    start(0);
    if (variant === 'atomic') {
      start(1);
    } else {
      await wait(0, 'loaded');
      if (variant === 'paused' || variant === 'fenced') {
        const pid = children[0].pid!;
        if (!children[0].kill('SIGSTOP')) throw new Error('could not stop holder');
        // Observe an OS-stopped process, rather than assuming signal delivery.
        while (true) {
          const { stdout } = await Promise.race([ps('ps', ['-o', 'stat=', '-p', String(pid)]), failure]);
          if (stdout.includes('T')) break;
          await Promise.race([sleep(10), failure]);
        }
        stopped = true;
        const since = performance.now();
        // Keep it stopped for longer than the full lease, then confirm Redis
        // really expired the key before allowing the new owner to acquire.
        await Promise.race([sleep(900), failure]);
        while (await redis.exists(lab.key('lock'))) await Promise.race([sleep(10), failure]);
        pausedMs = performance.now() - since;
        line('holder', `PID ${pid}, SIGSTOP confirmed; stopped ${Math.round(pausedMs)} ms (TTL 800 ms)`);
        start(1);
        await wait(1, 'loaded');
        go(1, 'loaded');
        await wait(1, 'written');
        // Keep B's lease held while A releases: old token must not delete B.
        children[0].kill('SIGCONT');
        go(0, 'loaded');
        await wait(0, 'written');
        go(0, 'written');
        await wait(0, 'closed');
        if (!await redis.exists(lab.key('lock'))) throw new Error('old owner removed the newer lease');
        go(1, 'written');
      } else if (variant === 'broken') {
        start(1);
        await wait(1, 'loaded');
        go(0, 'loaded');
        go(1, 'loaded');
        await Promise.all([wait(0, 'written'), wait(1, 'written')]);
        go(0, 'written');
        go(1, 'written');
      } else {
        start(1);
        await wait(1, 'denied');
        go(0, 'loaded');
        await wait(0, 'written');
        go(0, 'written');
        await wait(0, 'closed');
        await wait(1, 'loaded');
        go(1, 'loaded');
        await wait(1, 'written');
        go(1, 'written');
      }
    }
    await Promise.race([Promise.all(closed), failure]);
    verdict('accepted purchases', accepted, accepted === 1);
    verdict('oversold', Math.max(0, accepted - 1), accepted === 1);
    verdict('double write', accepted > 1 ? 'yes' : 'no', accepted === 1);
    line('remaining stock', stock);
    if (variant === 'fenced') verdict('stale writes rejected', staleRejected, staleRejected === 1);
    if (stopped) verdict('old token release', releases[0] ?? 'missing', releases[0] === 0);
    return { stock, accepted, staleRejected, stopped, pausedMs, releases };
  } finally {
    clearTimeout(deadline);
    abort.signal.removeEventListener('abort', onAbort);
    // SIGKILL works even on a stopped worker; SIGCONT also makes the cleanup
    // intent explicit. Await close before deleting keys or leaving the lab.
    for (const child of children) {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGCONT');
        child.kill('SIGKILL');
      }
    }
    await Promise.all(closed);
    try {
      await cleanup(redis, lab.prefix);
      if (await countKeys(redis, lab.prefix) !== 0) throw new Error('lab 05 keys remain');
    } finally {
      await redis.quit();
    }
  }
}

async function main() {
  if (process.platform === 'win32') throw new Error('Lab 05 needs macOS or Linux for SIGSTOP/SIGCONT');
  const variants: Variant[] = ['broken', 'lock', 'paused', 'fenced', 'atomic'];
  const { values } = parseArgs({ options: Object.fromEntries([...variants, 'fixed', 'check'].map((name) => [name, { type: 'boolean' as const }])) });
  const selected = Object.keys(values).filter((name) => values[name]);
  if (selected.length !== 1) throw new Error('Usage: npm run lab:05 -- --broken | --lock | --paused | --fenced | --atomic | --fixed | --check');
  if (!values.check) {
    await run(values.fixed ? 'atomic' : selected[0] as Variant);
    return;
  }
  for (const variant of variants) {
    const result = await run(variant);
    const expected = variant === 'broken' || variant === 'paused' ? 2 : 1;
    const paused = variant === 'paused' || variant === 'fenced';
    const ok = result.accepted === expected && result.stock === 0
      && result.staleRejected === (variant === 'fenced' ? 1 : 0)
      && (!paused || (result.stopped && result.pausedMs > 800 && result.releases[0] === 0 && result.releases[1] === 1))
      && (variant !== 'lock' || result.releases.every((release) => release === 1));
    verdict(`${variant}: expected outcome`, ok ? 'yes' : 'no', ok);
    if (!ok) throw new Error(`${variant}: outcome disagrees with Lesson 5`);
  }
  verdict('all workers reaped and keys cleaned', 'yes', true);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
