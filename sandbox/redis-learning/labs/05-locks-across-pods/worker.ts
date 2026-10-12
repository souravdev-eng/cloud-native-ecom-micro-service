import { randomUUID } from 'node:crypto';
import { connect, withPrefix } from '../../lib';

export type Variant = 'broken' | 'lock' | 'paused' | 'fenced' | 'atomic';
export type Notice = 'loaded' | 'denied' | 'written';
export type Request = { type: 'request'; id: number; operation: 'read' | 'write' | 'buy'; quantity?: number; fence?: number };
export type WorkerMessage = Request | { type: 'notice'; event: Notice } | { type: 'done'; release: number | null } | { type: 'error'; error: string };

export const RELEASE = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0`;

// Issue the fence in the same atomic turn as acquisition. Separate INCR
// after SET would let a paused old owner obtain a newer fence on resuming.
const ACQUIRE_FENCED = `
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
  return redis.call('INCR', KEYS[2])
end
return 0`;

const pending = new Map<number, (value: number) => void>();
const gates = new Map<string, () => void>();
let nextId = 0;
function request(operation: Request['operation'], quantity?: number, fence?: number): Promise<number> {
  return new Promise((resolve) => {
    const id = nextId++;
    pending.set(id, resolve);
    process.send!({ type: 'request', id, operation, quantity, fence });
  });
}
function gate(event: Notice): Promise<void> {
  return new Promise((resolve) => {
    gates.set(event, resolve);
    process.send!({ type: 'notice', event });
  });
}
process.on('message', (message: { type: string; id: number; value: number; event: string }) => {
  if (message.type === 'response') {
    pending.get(message.id)?.(message.value);
    pending.delete(message.id);
  } else if (message.type === 'go') {
    gates.get(message.event)?.();
    gates.delete(message.event);
  }
});
// A running worker must not outlive a lost parent. The parent's finally
// also kills stopped workers, which cannot handle disconnect themselves.
process.on('disconnect', () => process.exit(1));

process.once('message', async (job: { variant: Variant; index: number }) => {
  if (job.variant === undefined) return;
  let redis: Awaited<ReturnType<typeof connect>> | undefined;
  try {
    const { variant, index } = job;
    let release: number | null = null;
    if (variant === 'atomic') {
      await request('buy');
    } else {
      const locked = variant !== 'broken';
      const lab = withPrefix('05');
      const token = randomUUID();
      let fence = 0;
      if (locked) {
        redis = await connect();
        const ttl = index === 0 && (variant === 'paused' || variant === 'fenced') ? 800 : 10000;
        let reportedDenied = false;
        while (true) {
          const acquired = variant === 'fenced'
            ? Number(await redis.eval(ACQUIRE_FENCED, { keys: [lab.key('lock'), lab.key('fence')], arguments: [token, String(ttl)] }))
            : await redis.set(lab.key('lock'), token, { NX: true, PX: ttl });
          if (acquired) {
            fence = typeof acquired === 'number' ? acquired : 0;
            break;
          }
          if (!reportedDenied) {
            process.send!({ type: 'notice', event: 'denied' });
            reportedDenied = true;
          }
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
      const quantity = await request('read');
      await gate('loaded');
      if (quantity > 0) await request('write', quantity - 1, fence);
      await gate('written');
      if (redis) release = Number(await redis.eval(RELEASE, { keys: [lab.key('lock')], arguments: [token] }));
    }
    if (redis) await redis.quit();
    process.send!({ type: 'done', release }, () => process.exit(0));
  } catch (error) {
    redis?.disconnect();
    process.send!({ type: 'error', error: String(error) }, () => process.exit(1));
  }
});
