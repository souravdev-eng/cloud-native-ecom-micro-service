import type { WorkerContext } from '../../processes';

/** Reports which process ran it, so the test can prove the workers are separate processes. */
export default async function reportPid(input: { greeting: string }, ctx: WorkerContext) {
  return { pid: process.pid, index: ctx.index, workers: ctx.workers, greeting: input.greeting };
}
