import { startTelemetry } from '@ecom-micro/common/telemetry';

/**
 * Starts OpenTelemetry tracing. `index.ts` imports this file first, because
 * auto-instrumentation only patches Express, Mongoose and amqplib if they
 * are loaded after the SDK has started. Keep it free of other app imports.
 *
 * Spans go to `OTEL_EXPORTER_OTLP_ENDPOINT` (Alloy in the cluster). With no
 * endpoint, or under Jest, nothing is exported.
 */
export const telemetry = startTelemetry({ serviceName: 'auth-service' });
