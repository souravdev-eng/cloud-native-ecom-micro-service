import { createClient } from 'redis';

export type LabClient = ReturnType<typeof createClient>;

/** The `single` profile publishes Redis here; see docker-compose.yml. */
export const DEFAULT_URL = 'redis://localhost:6390';

/**
 * Host ports 6390–6399 are reserved for the sandbox. 6379 is deliberately
 * outside the range, because that's where a `kubectl port-forward` to the
 * cluster's product-redis would sit.
 */
const SANDBOX_PORTS = { min: 6390, max: 6399 };
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Inside the compose network (the `lab-runner` container used by later
 * lessons) Redis is reached by service name on its default port. Every
 * service in docker-compose.yml is named `lab-*` so this pattern can't match
 * a cluster service such as `product-redis-service`.
 */
const COMPOSE_HOST = /^lab-[a-z0-9-]+$/;

/**
 * Throws unless `url` points at the local sandbox Redis. There is no
 * override flag on purpose: a lab that can only reach the sandbox can never
 * wipe the product cache.
 */
export function assertSandboxUrl(url: string): void {
  const refuse = (why: string): never => {
    throw new Error(`${url} is not a sandbox Redis (${why}). Labs only run against localhost:6390-6399 or a lab-* compose service.`);
  };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return refuse('not a valid URL');
  }
  if (parsed.protocol !== 'redis:') refuse(`scheme ${parsed.protocol}`);

  const host = parsed.hostname;
  if (COMPOSE_HOST.test(host)) return;
  if (!LOCAL_HOSTS.has(host)) refuse(`host ${host}`);

  const port = Number(parsed.port || 6379);
  if (port < SANDBOX_PORTS.min || port > SANDBOX_PORTS.max) refuse(`port ${port}`);
}

/**
 * Opens a client to the sandbox Redis, after the guard has approved the URL.
 * Reconnects are off so a missing sandbox fails fast with a hint, instead of
 * the client retrying forever.
 */
export async function connect(url = process.env.REDIS_URL ?? DEFAULT_URL): Promise<LabClient> {
  assertSandboxUrl(url);
  const client = createClient({ url, socket: { connectTimeout: 2000, reconnectStrategy: false } });
  /**
   * node-redis crashes the process on an unhandled 'error' event. While
   * connecting, the rejection below reports the error; after that, it's
   * printed so a Redis that dies mid-lab doesn't fail silently.
   */
  let connected = false;
  client.on('error', (err: Error) => {
    if (connected) console.error(`Redis error (${url}): ${err.message}`);
  });
  try {
    await client.connect();
  } catch (err) {
    throw new Error(`Can't reach ${url}: ${(err as Error).message}. Is the sandbox running? Try \`npm run redis:single\`.`);
  }
  connected = true;
  return client;
}
