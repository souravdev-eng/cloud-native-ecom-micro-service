import { fork } from 'node:child_process';
import path from 'node:path';

/** What each worker is told about itself, next to the lab's own input. */
export interface WorkerContext {
  index: number;
  workers: number;
}

/** A worker module's default export: one pod's share of the lab. */
export type WorkerFn<I, R> = (input: I, ctx: WorkerContext) => Promise<R>;

/** The messages a worker process sends back over the IPC channel. */
export type WorkerReply<R> = { ok: true; result: R } | { ok: false; error: string };

export interface WorkerJob<I> {
  module: string;
  input: I;
  ctx: WorkerContext;
}

const ENTRY = path.join(__dirname, 'worker-entry.ts');

/**
 * Starts `n` separate Node processes, each running the default export of
 * `workerModule`, and resolves with their results in index order.
 *
 * Processes rather than promises, because "three pods" means three
 * programs with their own memory and their own Redis connection. Promises
 * in one process would share variables and hide the problem the labs are
 * about.
 */
export function runConcurrently<I, R>(n: number, workerModule: string, input: I): Promise<R[]> {
  const runs = Array.from({ length: n }, (_, index) =>
    runOne<I, R>({ module: path.resolve(workerModule), input, ctx: { index, workers: n } }));
  return Promise.all(runs);
}

function runOne<I, R>(job: WorkerJob<I>): Promise<R> {
  return new Promise((resolve, reject) => {
    /**
     * fork() reuses this process's execArgv by default, which carries tsx's
     * loader flags, so the child can run TypeScript too.
     */
    const child = fork(ENTRY, [], { stdio: ['ignore', 'inherit', 'inherit', 'ipc'] });
    let reply: WorkerReply<R> | undefined;

    child.on('message', (message) => { reply = message as WorkerReply<R>; });
    child.on('error', reject);
    /** 'close' fires after the IPC channel has drained, so a reply can't arrive after it. */
    child.on('close', (code) => {
      if (reply?.ok) return resolve(reply.result);
      const why = reply && !reply.ok ? reply.error : `exited with code ${code} before replying`;
      reject(new Error(`worker ${job.ctx.index} failed: ${why}`));
    });
    child.send(job);
  });
}
