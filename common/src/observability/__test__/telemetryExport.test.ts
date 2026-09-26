/**
 * When the bootstrap exports, and that exporting can never hurt the service.
 * These tests stand up a fake OTLP collector (a plain HTTP server) and assert
 * on what reaches it, so they don't depend on how the exporter is built.
 */
/**
 * Maps Jest's mock of Node's `module` built-in back to the real one, so the
 * HTTP instrumentation can patch `http` and requests produce real spans (see
 * telemetry.test.ts for the full story). Hoisted above the imports by ts-jest.
 */
jest.mock('module', () => (process as any).getBuiltinModule('module'));
import http from 'http';
import net, { AddressInfo } from 'net';
import type { Express } from 'express';
import { trace } from '@opentelemetry/api';
import { startTelemetry, TelemetryHandle } from '../telemetry';
import { createLogger } from '../logger';
import { captureStdout, CapturedStdout } from '../../test/captureStdout';
import { isolateEnv } from '../../test/isolateEnv';

/** A recording stand-in for Alloy's OTLP/HTTP receiver. */
interface FakeCollector {
  url: string;
  /** Request paths received so far, e.g. `/v1/traces`. */
  received: string[];
  close(): Promise<void>;
}

const startFakeCollector = async (): Promise<FakeCollector> => {
  const received: string[] = [];
  const server = http.createServer((req, res) => {
    received.push(req.url ?? '');
    /** Draining the body before answering is what a real receiver does. */
    req.resume();
    req.on('end', () => res.writeHead(200, { 'content-type': 'application/x-protobuf' }).end());
  });
  server.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    received,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
};

/**
 * Returns a port nothing listens on, by binding one and releasing it again.
 * Exporting there behaves like a collector that has been scaled to zero.
 */
const closedPort = async (): Promise<number> => {
  const probe = net.createServer().listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => probe.once('listening', resolve));
  const { port } = probe.address() as AddressInfo;
  await new Promise<void>((resolve) => probe.close(() => resolve()));
  return port;
};

/** Creates one span with a log line inside it, the smallest unit of "telemetry happened". */
const emitSpanWithLog = () => {
  const logger = createLogger({ service: 'test-service' });
  trace.getTracer('telemetry-export-test').startActiveSpan('unit-of-work', (span) => {
    logger.info('inside the span');
    span.end();
  });
};

describe('startTelemetry exporting', () => {
  let telemetry: TelemetryHandle | undefined;
  let collector: FakeCollector;
  let stdout: CapturedStdout;

  /** Each test decides for itself whether an endpoint is set and what NODE_ENV is. */
  isolateEnv(['NODE_ENV', 'OTEL_EXPORTER_OTLP_ENDPOINT', 'OTEL_EXPORTER_OTLP_TRACES_ENDPOINT', 'LOG_FORMAT', 'LOG_LEVEL']);

  beforeEach(async () => {
    collector = await startFakeCollector();
    stdout = captureStdout();
  });

  afterEach(async () => {
    /**
     * Tests shut down before asserting, because that flushes queued spans;
     * this is the safety net for a test that failed first. A second
     * `shutdown` on the same handle does nothing.
     */
    await telemetry?.shutdown();
    stdout.restore();
    await collector.close();
  });

  it('sends nothing under NODE_ENV=test, even with an endpoint set, and logging still works', async () => {
    process.env.NODE_ENV = 'test';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = collector.url;
    const connect = jest.spyOn(net.Socket.prototype, 'connect');
    telemetry = startTelemetry({ serviceName: 'test-service' });

    emitSpanWithLog();
    await telemetry.shutdown();

    /** The collector check proves nothing reached it; the spy proves nothing was even attempted. */
    expect(connect).not.toHaveBeenCalled();
    expect(collector.received).toEqual([]);
    const [line] = await stdout.json();
    expect(line.message).toBe('inside the span');
    /** Spans are still created locally, so logs keep their trace_id for local debugging. */
    expect(line.trace_id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('opens no network connection when no endpoint is set', async () => {
    process.env.NODE_ENV = 'production';
    /**
     * Every TCP client connection in Node goes through `Socket#connect`, so a
     * spy on it catches an exporter falling back to its default localhost:4318.
     */
    const connect = jest.spyOn(net.Socket.prototype, 'connect');
    telemetry = startTelemetry({ serviceName: 'test-service' });

    emitSpanWithLog();
    await telemetry.shutdown();

    expect(connect).not.toHaveBeenCalled();
    const [line] = await stdout.json();
    expect(line.message).toBe('inside the span');
  });

  it('exports spans over OTLP/HTTP to the configured endpoint', async () => {
    /**
     * The positive control: without it, the two "sends nothing" tests would
     * also pass if exporting were simply broken.
     */
    process.env.NODE_ENV = 'production';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = collector.url;
    telemetry = startTelemetry({ serviceName: 'test-service' });

    emitSpanWithLog();
    await telemetry.shutdown();

    expect(collector.received).toContain('/v1/traces');
  });

  it('keeps serving requests when the collector is down', async () => {
    process.env.NODE_ENV = 'production';
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = `http://127.0.0.1:${await closedPort()}`;
    telemetry = startTelemetry({ serviceName: 'test-service' });

    const express = require('express') as () => Express;
    const app = express();
    app.get('/ping', (_req, res) => res.json({ pong: true }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/ping`;

    try {
      /** Several requests, so the failed exports overlap with live traffic. */
      for (let i = 0; i < 3; i += 1) {
        const response = await fetch(url);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ pong: true });
      }
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    /** Flushing to a dead collector must settle quietly, not throw into the service. */
    await expect(telemetry.shutdown()).resolves.toBeUndefined();
  });
});
