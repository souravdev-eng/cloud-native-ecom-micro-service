/**
 * The deprecated `winstonLogger` must keep existing callers (auth) compiling
 * and logging, while no longer sending anything to Elasticsearch (ADR 0001).
 */
import http from 'http';
import { AddressInfo } from 'net';
import { winstonLogger } from '../logger';
import { captureStdout, CapturedStdout } from '../../test/captureStdout';
import { isolateEnv } from '../../test/isolateEnv';

describe('winstonLogger (deprecated)', () => {
  let stdout: CapturedStdout;
  let server: http.Server;
  let requestsReceived: number;
  let elasticSearchNode: string;

  isolateEnv(['NODE_ENV', 'LOG_LEVEL']);

  beforeEach(async () => {
    /**
     * A local HTTP server stands in for Elasticsearch. Counting the requests it
     * receives is an observable way to prove the wrapper makes no Elasticsearch
     * calls, without mocking any client library. Port 0 lets the OS pick a free port.
     */
    requestsReceived = 0;
    server = http.createServer((_req, res) => {
      requestsReceived += 1;
      res.end('{}');
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    elasticSearchNode = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    stdout = captureStdout();
  });

  afterEach(async () => {
    stdout.restore();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('returns a logger that writes the new JSON schema to stdout', async () => {
    const logger = winstonLogger(elasticSearchNode, 'auth-service', 'info');

    logger.info('Mongo connected successfully');

    const [line] = await stdout.json();
    expect(line).toMatchObject({
      level: 'info',
      service: 'auth-service',
      message: 'Mongo connected successfully',
      timestamp: expect.any(String),
      version: expect.any(String),
      environment: expect.any(String),
    });
  });

  it('honours the level argument when LOG_LEVEL is unset', async () => {
    const logger = winstonLogger(elasticSearchNode, 'auth-service', 'debug');

    logger.debug('detail');

    const [line] = await stdout.json();
    expect(line.level).toBe('debug');
  });

  it('lets LOG_LEVEL override the level argument', async () => {
    /**
     * auth hardcodes the level argument, so the env var has to win for
     * LOG_LEVEL to be useful without a code change.
     */
    process.env.LOG_LEVEL = 'warn';
    const logger = winstonLogger(elasticSearchNode, 'auth-service', 'debug');

    logger.info('routine event');

    expect(await stdout.lines()).toEqual([]);
  });

  it('makes no calls to the Elasticsearch node', async () => {
    const logger = winstonLogger(elasticSearchNode, 'auth-service', 'info');

    logger.info('one');
    logger.error('two');

    /**
     * The old transport sent bulk requests shortly after each write. Waiting a
     * little longer than one flush gives a regression time to show up.
     */
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(requestsReceived).toBe(0);
  });
});
