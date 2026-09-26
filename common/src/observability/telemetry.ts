/**
 * The telemetry bootstrap: one call that starts OpenTelemetry tracing for a
 * service. It lives on its own subpath, `@ecom-micro/common/telemetry`, and
 * must stay free of Express, Mongoose, amqplib and the rest of common: it is
 * imported before them, and auto-instrumentation can only patch modules that
 * are loaded after the SDK has started.
 *
 * Usage, as the very first line of a service's entry file:
 *
 *   import './tracing'; // which calls startTelemetry({ serviceName: 'auth-service' })
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { context, propagation, trace } from '@opentelemetry/api';
import { envDetector, hostDetector, ResourceDetector } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  NoopSpanProcessor,
  ParentBasedSampler,
  SimpleSpanProcessor,
  SpanExporter,
  SpanProcessor,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { MongooseInstrumentation } from '@opentelemetry/instrumentation-mongoose';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { AmqplibInstrumentation } from '@opentelemetry/instrumentation-amqplib';
import { defaultEnvironment, defaultVersion } from './serviceInfo';
import { RedactingSpanExporter } from './spanRedaction';

export interface TelemetryOptions {
  /** The `service.name` on every span, such as `auth-service`. Use the same name as the logger. */
  serviceName: string;
  /** Defaults as in `serviceInfo.ts`, shared with the logger. */
  version?: string;
  /** Defaults as in `serviceInfo.ts`, shared with the logger. */
  environment?: string;
  /** Test-only: spans go to this exporter as each one ends, instead of over OTLP. */
  testSpanExporter?: SpanExporter;
}

export interface TelemetryHandle {
  /**
   * Flushes queued spans, then stops the SDK and removes its patches. Call it
   * on graceful shutdown; it never rejects, even if the collector is down.
   */
  shutdown(): Promise<void>;
}

/**
 * The default sampling ratio when `OTEL_TRACES_SAMPLER_ARG` is unset or
 * invalid: keep every trace. Alloy's tail sampling does the real cost
 * control later, where it can still see which traces errored or were slow.
 */
const DEFAULT_SAMPLE_RATIO = 1;

let active: TelemetryHandle | undefined;

/**
 * Reads the head-sampling ratio from the standard `OTEL_TRACES_SAMPLER_ARG`
 * variable. It must be a number from 0 (keep nothing) to 1 (keep everything).
 */
const sampleRatio = (): number => {
  const raw = process.env.OTEL_TRACES_SAMPLER_ARG?.trim();
  /** `Number('')` is 0, so an empty value must count as unset, not as "keep nothing". */
  const ratio = raw ? Number(raw) : NaN;
  return ratio >= 0 && ratio <= 1 ? ratio : DEFAULT_SAMPLE_RATIO;
};

/**
 * Decides where finished spans go: to the test exporter if one is injected;
 * nowhere under `NODE_ENV=test` or without an endpoint; otherwise over
 * OTLP/HTTP to `OTEL_EXPORTER_OTLP_ENDPOINT` (read by the exporter itself).
 */
const spanProcessorFor = (options: TelemetryOptions): SpanProcessor => {
  /**
   * Every exporter is wrapped in the redactor, the test one included, so the
   * tests see exactly what production would send.
   */
  if (options.testSpanExporter) return new SimpleSpanProcessor(new RedactingSpanExporter(options.testSpanExporter));

  const endpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  /**
   * "Nowhere" is a no-op processor rather than none, because the SDK only
   * installs a tracer provider when it has one. Spans still get IDs, so logs
   * keep their trace_id and `x-trace-id` still works locally.
   */
  if (process.env.NODE_ENV === 'test' || !endpoint) return new NoopSpanProcessor();

  /**
   * The batch processor exports off the request path, from a bounded queue.
   * If the collector is down, exports fail after a timeout and the spans are
   * dropped, while requests carry on untouched.
   */
  return new BatchSpanProcessor(new RedactingSpanExporter(new OTLPTraceExporter()));
};

/**
 * `service.*` and `deployment.environment` identify the build; the k8s
 * attributes come from the downward API (see `k8s/auth-depl.yml`) and are
 * left out when unset. `deployment.environment.name` is the current semantic
 * convention and `deployment.environment` the older name Grafana still uses
 * in many places, so both are set.
 */
const resourceAttributes = (options: TelemetryOptions): Record<string, string> => {
  const environment = options.environment || defaultEnvironment();
  const attributes: Record<string, string> = {
    'service.name': options.serviceName,
    'service.version': options.version || defaultVersion(),
    'deployment.environment': environment,
    'deployment.environment.name': environment,
  };
  if (process.env.K8S_POD_NAME) attributes['k8s.pod.name'] = process.env.K8S_POD_NAME;
  if (process.env.K8S_NAMESPACE) attributes['k8s.namespace.name'] = process.env.K8S_NAMESPACE;
  return attributes;
};

/**
 * Starts tracing for this process and returns a handle to stop it. Calling
 * it again returns the handle from the first call, because OpenTelemetry
 * allows only one global tracer provider per process.
 */
export const startTelemetry = (options: TelemetryOptions): TelemetryHandle => {
  if (active) return active;

  /**
   * Kept so `shutdown` can unpatch them: NodeSDK's own shutdown flushes and
   * stops the providers but leaves the library patches in place.
   */
  const instrumentations = [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new MongoDBInstrumentation(),
    new MongooseInstrumentation(),
    new PgInstrumentation(),
    new IORedisInstrumentation(),
    new RedisInstrumentation(),
    new AmqplibInstrumentation(),
  ];

  /**
   * A later resource detector wins, so the options go last and beat
   * `OTEL_SERVICE_NAME` / `OTEL_RESOURCE_ATTRIBUTES`. That keeps `service.name`
   * equal to the logger's `service` label, which trace-to-logs links rely on.
   */
  const explicitOptionsDetector: ResourceDetector = { detect: () => ({ attributes: resourceAttributes(options) }) };

  const sdk = new NodeSDK({
    /**
     * The process detector is left out on purpose: it records the full
     * command line, which can carry secrets, and resource attributes aren't redacted.
     */
    resourceDetectors: [envDetector, hostDetector, explicitOptionsDetector],
    /**
     * A root span (no incoming `traceparent`) is kept with probability
     * `ratio`; a child always follows its parent's decision, so a trace is
     * never half-recorded across services.
     */
    sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(sampleRatio()) }),
    spanProcessors: [spanProcessorFor(options)],
    instrumentations,
    /**
     * Left unset, these two would make NodeSDK export metrics and logs over
     * OTLP to localhost by default. Metrics arrive in a later ticket, and logs
     * go to stdout for Alloy to tail (ADR 0001), so both are explicitly off.
     */
    metricReaders: [],
    logRecordProcessors: [],
  });
  sdk.start();

  const handle: TelemetryHandle = {
    shutdown: async () => {
      if (active !== handle) return;
      active = undefined;
      try {
        await sdk.shutdown();
      } catch {
        /** A failed final flush means lost spans, which must never crash a stopping service. */
      }
      instrumentations.forEach((instrumentation) => instrumentation.disable());
      /**
       * Releasing the global registrations lets a later `startTelemetry` in
       * the same process (tests do this) install a fresh provider.
       */
      trace.disable();
      context.disable();
      propagation.disable();
    },
  };
  active = handle;
  return handle;
};
