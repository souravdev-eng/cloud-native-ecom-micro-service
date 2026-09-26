/**
 * Behaviour tests for the telemetry bootstrap over real HTTP. They assert only
 * on what leaves the process: exported spans, stdout log lines and headers.
 */
/**
 * Jest hands tests a mock of the `module` built-in, which the SDK's require
 * hooks would patch instead of the real one. Mapping it back lets `http` be
 * patched as in a service; Express still loads through Jest's registry and
 * escapes the hooks, so these tests rely only on the `http` server span.
 */
jest.mock('module', () => (process as any).getBuiltinModule('module'));
import http from 'http';
import { AddressInfo } from 'net';
import type { Express } from 'express';
import { SpanKind, trace } from '@opentelemetry/api';
import { InMemorySpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { startTelemetry, TelemetryHandle } from '../telemetry';
import { createLogger } from '../logger';
import { TRACE_ID_HEADER, traceIdHeader } from '../../middleware/traceIdHeader';
import { captureStdout, CapturedStdout } from '../../test/captureStdout';
import { isolateEnv } from '../../test/isolateEnv';

/**
 * A W3C `traceparent` is `version-traceId-parentSpanId-flags`. Flags `01`
 * means "sampled", which a parent-based sampler must honour.
 */
const UPSTREAM_TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const UPSTREAM_SPAN_ID = '00f067aa0ba902b7';
const UPSTREAM_TRACEPARENT = `00-${UPSTREAM_TRACE_ID}-${UPSTREAM_SPAN_ID}-01`;

/** Values that must never reach an exported span, whichever attribute they'd land in. */
const SECRETS = {
  resetToken: 'reset-token-3f9a7c',
  bearer: 'eyJhbGciOiJIUzI1NiJ9.payload.sig',
  password: 'hunter2-correct-horse',
  sessionCookie: 'session=c2Vzc2lvbi1zZWNyZXQ',
};

describe('startTelemetry with an in-memory exporter', () => {
  const exporter = new InMemorySpanExporter();
  let telemetry: TelemetryHandle;
  let server: http.Server;
  let baseUrl: string;
  let stdout: CapturedStdout;

  /** The resource is detected once at start-up, so the env is set up once for the whole file. */
  isolateEnv(['K8S_POD_NAME', 'K8S_NAMESPACE', 'OTEL_SERVICE_NAME', 'OTEL_RESOURCE_ATTRIBUTES'], 'all');

  beforeAll(async () => {
    process.env.K8S_POD_NAME = 'auth-deployment-7d9f-abcde';
    process.env.K8S_NAMESPACE = 'default';
    /**
     * Conflicting standard OTel variables. The explicit options must win, so
     * `service.name` always equals the logger's `service` label that
     * Grafana's trace-to-logs link filters on.
     */
    process.env.OTEL_SERVICE_NAME = 'name-from-env';
    process.env.OTEL_RESOURCE_ATTRIBUTES = 'service.version=0.0.0-env,team=identity';
    telemetry = startTelemetry({
      serviceName: 'test-service',
      version: '9.9.9',
      environment: 'ci',
      testSpanExporter: exporter,
    });

    /**
     * Express is required only after the SDK has started, mirroring the
     * import-order rule services must follow: auto-instrumentation can only
     * patch modules loaded after `startTelemetry` runs.
     */
    const express = require('express') as () => Express;
    const app = express();
    const logger = createLogger({ service: 'test-service' });

    app.use(traceIdHeader);
    app.use(require('express').json());
    app.get('/hello', (_req, res) => {
      logger.info('handling hello');
      res.json({ ok: true });
    });
    app.post('/reset-password', (req, res) => {
      const span = trace.getActiveSpan()!;
      /**
       * The HTTP instrumentation records no headers or bodies by default, so
       * the handler copies them in the shape `headersToSpanAttributes` would
       * use. Otherwise the header assertions below would pass without the
       * redactor ever running.
       */
      span.setAttribute('http.request.header.authorization', [req.headers.authorization ?? '']);
      span.setAttribute('http.request.header.cookie', [req.headers.cookie ?? '']);
      /** A custom attribute with a secret name is the realistic way a password reaches a span. */
      span.setAttribute('user.password', req.body.password);
      span.setAttribute('user.email', 'jane.doe@example.com');
      /** Links carry attributes too, and are exported alongside the span that holds them. */
      trace
        .getTracer('telemetry-test')
        .startSpan('linked-work', { links: [{ context: span.spanContext(), attributes: { resetToken: req.body.token } }] })
        .end();
      res.status(204).end();
    });

    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await telemetry.shutdown();
  });

  beforeEach(() => {
    exporter.reset();
    stdout = captureStdout();
  });

  afterEach(() => {
    stdout.restore();
  });

  /**
   * Requests go through the global `fetch` (undici), which the bootstrap
   * doesn't instrument. With `http.request`, the client side would get its
   * own span and inject its own `traceparent`, replacing the one a test sets.
   */
  const request = (path: string, init?: RequestInit) => fetch(`${baseUrl}${path}`, init);

  /**
   * The server span ends on the response's `finish` event, which can fire
   * just after the client has already read the response. Polling for a short
   * while avoids a flaky race without a fixed sleep.
   */
  const waitForServerSpan = async (path: string): Promise<ReadableSpan> => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const span = exporter
        .getFinishedSpans()
        .find((s) => s.kind === SpanKind.SERVER && s.attributes['url.path'] === path);
      if (span) return span;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error(`No server span for ${path} was exported`);
  };

  it('links the log line, the exported server span and the x-trace-id header by one trace ID', async () => {
    const response = await request('/hello');
    expect(response.status).toBe(200);

    const span = await waitForServerSpan('/hello');
    const [line] = (await stdout.json()).filter((entry) => entry.message === 'handling hello');

    /** A trace ID is 32 lowercase hex characters; an all-zero one would mean "no trace". */
    expect(span.spanContext().traceId).toMatch(/^(?!0+$)[0-9a-f]{32}$/);
    expect(line.trace_id).toBe(span.spanContext().traceId);
    expect(response.headers.get(TRACE_ID_HEADER)).toBe(span.spanContext().traceId);
    /**
     * The log was written inside the handler, so its span is the server span
     * itself (or a child of it); either way it belongs to that request.
     */
    expect(line.span_id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('continues an incoming W3C traceparent instead of starting a new trace', async () => {
    const response = await request('/hello', { headers: { traceparent: UPSTREAM_TRACEPARENT } });

    const span = await waitForServerSpan('/hello');
    expect(span.spanContext().traceId).toBe(UPSTREAM_TRACE_ID);
    /** The upstream span becomes the parent, so the ingress hop and this service join up in Tempo. */
    expect(span.parentSpanContext?.spanId).toBe(UPSTREAM_SPAN_ID);
    expect(response.headers.get(TRACE_ID_HEADER)).toBe(UPSTREAM_TRACE_ID);
  });

  it('keeps passwords, tokens, auth headers and the ?token= query out of span attributes', async () => {
    await request(`/reset-password?token=${SECRETS.resetToken}&email=jane.doe@example.com`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${SECRETS.bearer}`,
        cookie: SECRETS.sessionCookie,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ password: SECRETS.password, token: SECRETS.resetToken }),
    });

    const span = await waitForServerSpan('/reset-password');
    /** Every span in the trace is checked, including the linked child, not just the server span. */
    const exported = JSON.stringify(
      exporter
        .getFinishedSpans()
        .filter((s) => s.spanContext().traceId === span.spanContext().traceId)
        .map((s) => ({ attributes: s.attributes, events: s.events, links: s.links, resource: s.resource.attributes }))
    );

    for (const secret of Object.values(SECRETS)) {
      expect(exported).not.toContain(secret);
    }
    expect(exported).not.toContain('jane.doe@example.com');
    /** The query string arrives URL-encoded, so the email must not survive as `%40` either. */
    expect(exported).not.toContain('jane.doe%40example.com');
    /** The path and the masked email stay, so the span is still useful when debugging. */
    expect(exported).toContain('/reset-password');
    expect(exported).toContain('j***@example.com');
  });

  it('describes the service in the resource attributes of every span, letting explicit options win over env', async () => {
    await request('/hello');

    const span = await waitForServerSpan('/hello');
    expect(span.resource.attributes).toEqual(
      expect.objectContaining({
        'service.name': 'test-service',
        'service.version': '9.9.9',
        'deployment.environment': 'ci',
        'k8s.pod.name': 'auth-deployment-7d9f-abcde',
        'k8s.namespace.name': 'default',
        /** Env attributes that don't conflict with an option are still kept. */
        team: 'identity',
      })
    );
    /**
     * The command line can carry secrets (`--password=…`) and is never
     * redacted as a resource attribute, so it must not be collected at all.
     */
    /** The array form matters: a dotted string would be read as a nested path and always pass. */
    expect(span.resource.attributes).not.toHaveProperty(['process.command_args']);
    expect(span.resource.attributes).not.toHaveProperty(['process.command']);
  });
});
