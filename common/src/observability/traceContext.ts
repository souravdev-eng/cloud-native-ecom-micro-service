import { context, isSpanContextValid, trace } from '@opentelemetry/api';

/**
 * Returns the IDs of the span that is active right now, or `undefined` outside
 * any span. "Active" is tracked per async call chain by the SDK's context
 * manager (AsyncLocalStorage), so code deep inside a request handler sees that
 * request's span without anything being passed down.
 *
 * Without a started SDK the API is a no-op and there is never a valid span,
 * so callers can use this unconditionally.
 */
export const activeTraceIds = (): { traceId: string; spanId: string } | undefined => {
  const span = trace.getSpan(context.active());
  if (!span) return undefined;

  const spanContext = span.spanContext();
  /** An all-zero ID means "no trace", which is what a non-recording placeholder span carries. */
  if (!isSpanContextValid(spanContext)) return undefined;
  return { traceId: spanContext.traceId, spanId: spanContext.spanId };
};
