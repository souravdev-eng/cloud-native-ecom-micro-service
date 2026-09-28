/**
 * Behaviour tests for the logger factory. They only look at what lands on
 * stdout, never at Winston internals, so they keep passing if the logger
 * library underneath is swapped.
 */
import { createLogger } from '../logger';
import { captureStdout, CapturedStdout } from '../../test/captureStdout';
import { isolateEnv } from '../../test/isolateEnv';

/** The env vars the factory reads; each test starts with all of them unset. */
const LOGGER_ENV = ['NODE_ENV', 'LOG_LEVEL', 'LOG_FORMAT', 'SERVICE_VERSION', 'DEPLOYMENT_ENVIRONMENT'];

describe('createLogger', () => {
  let stdout: CapturedStdout;

  /**
   * Jest sets NODE_ENV=test, and a developer's shell might set LOG_LEVEL.
   * Clearing them makes every test start from the factory's defaults.
   */
  isolateEnv(LOGGER_ENV);

  beforeEach(() => {
    stdout = captureStdout();
  });

  afterEach(() => {
    stdout.restore();
  });

  it('writes exactly one JSON line carrying every schema field', async () => {
    const logger = createLogger({ service: 'auth-service', version: '1.4.2', environment: 'staging' });

    logger.error('Mongo connection failed', { error: new TypeError('socket closed'), attempt: 3 });

    const lines = await stdout.json();
    expect(lines).toHaveLength(1);
    const [line] = lines;

    /**
     * The timestamp and stack use `expect.any(String)` because their values
     * depend on the clock and file layout; only their presence is the contract.
     */
    expect(line).toEqual({
      timestamp: expect.any(String),
      level: 'error',
      service: 'auth-service',
      version: '1.4.2',
      environment: 'staging',
      message: 'Mongo connection failed',
      error: { name: 'TypeError', message: 'socket closed', stack: expect.any(String) },
      attempt: 3,
    });
    /**
     * `toEqual` ignores key order, so the order is checked separately. Fixed
     * fields first keeps raw lines scannable in `kubectl logs`.
     */
    expect(Object.keys(line).slice(0, 6)).toEqual(['timestamp', 'level', 'service', 'version', 'environment', 'message']);
    /** ISO-8601, so Loki and Grafana parse it without a custom format. */
    expect(new Date(line.timestamp).toISOString()).toBe(line.timestamp);
    expect(line.error.stack).toContain('socket closed');
  });

  it('serialises an Error passed as the only argument', async () => {
    const logger = createLogger({ service: 'auth-service' });

    /** The auth queue producer calls `logger.error(error)` like this today. */
    logger.error(new Error('channel closed'));

    const [line] = await stdout.json();
    expect(line.message).toBe('channel closed');
    expect(line.error).toEqual({ name: 'Error', message: 'channel closed', stack: expect.any(String) });
  });

  it('defaults version and environment from the environment variables', async () => {
    process.env.SERVICE_VERSION = '2.0.0';
    process.env.DEPLOYMENT_ENVIRONMENT = 'local';
    const logger = createLogger({ service: 'auth-service' });

    logger.info('started');

    const [line] = await stdout.json();
    expect(line).toMatchObject({ version: '2.0.0', environment: 'local' });
  });

  it('filters out levels below LOG_LEVEL', async () => {
    process.env.LOG_LEVEL = 'warn';
    const logger = createLogger({ service: 'auth-service' });

    logger.debug('noisy detail');
    logger.info('routine event');
    logger.warn('slow query');
    logger.error('query failed');

    const levels = (await stdout.json()).map((line) => line.level);
    expect(levels).toEqual(['warn', 'error']);
  });

  it('logs at info and above when LOG_LEVEL is unset', async () => {
    const logger = createLogger({ service: 'auth-service' });

    logger.debug('noisy detail');
    logger.info('routine event');

    const levels = (await stdout.json()).map((line) => line.level);
    expect(levels).toEqual(['info']);
  });

  it('writes human-readable, non-JSON output when NODE_ENV=development', async () => {
    process.env.NODE_ENV = 'development';
    const logger = createLogger({ service: 'auth-service' });

    logger.info('Auth service running on PORT 3000', { port: 3000 });

    const lines = await stdout.lines();
    expect(lines).toHaveLength(1);
    expect(() => JSON.parse(lines[0])).toThrow();
    expect(lines[0]).toContain('Auth service running on PORT 3000');
    expect(lines[0]).toContain('auth-service');
  });

  it('writes JSON in development when LOG_FORMAT=json overrides it', async () => {
    /**
     * The local cluster runs with NODE_ENV=development, but Alloy can only parse
     * JSON, so the ConfigMap forces JSON with LOG_FORMAT.
     */
    process.env.NODE_ENV = 'development';
    process.env.LOG_FORMAT = 'json';
    const logger = createLogger({ service: 'auth-service' });

    logger.info('started');

    const [line] = await stdout.json();
    expect(line).toMatchObject({ level: 'info', message: 'started' });
  });
});
