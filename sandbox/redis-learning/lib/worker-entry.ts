import type { WorkerFn, WorkerJob, WorkerReply } from './processes';

/**
 * The program each child process runs. It waits for one job from the
 * parent, runs the worker module's default export, sends back the result
 * or the error, and exits.
 */
process.once('message', async (job: WorkerJob<unknown>) => {
  let reply: WorkerReply<unknown>;
  try {
    const work: WorkerFn<unknown, unknown> = require(job.module).default;
    reply = { ok: true, result: await work(job.input, job.ctx) };
  } catch (err) {
    reply = { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
  /** Exit only once the reply has been flushed, or the parent would see an exit with no result. */
  process.send!(reply, () => process.exit(0));
});
