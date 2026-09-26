import { Attributes } from '@opentelemetry/api';
import { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { isSensitiveKey } from './sensitiveKeys';
import { maskText } from './maskText';
import { REDACTED } from './placeholders';

/**
 * Applies the logger's redaction policy to span attributes: an attribute
 * with a secret name (`user.password`, `http.request.header.authorization`)
 * becomes `[REDACTED]`, and every string value has its secret query
 * parameters, emails and Stripe keys masked (so `url.query` loses `token=`).
 */
export const redactAttributes = (attributes: Attributes): Attributes => {
  const redacted: Attributes = {};
  for (const [key, value] of Object.entries(attributes)) {
    redacted[key] = isSensitiveKey(key) ? REDACTED : maskValue(value);
  }
  return redacted;
};

type AttributeValue = Attributes[string];

/** Masks the text inside a value; OTel arrays are homogeneous, so only string elements need it. */
const maskValue = (value: AttributeValue): AttributeValue => {
  if (typeof value === 'string') return maskText(value);
  if (Array.isArray(value)) return value.map((item) => (typeof item === 'string' ? maskText(item) : item)) as typeof value;
  return value;
};

/** Redacts the attributes of each event or link, which are `exception.message` or caller-supplied. */
const redactEach = <T extends { attributes?: Attributes }>(items: T[]): T[] =>
  items.map((item) => (item.attributes ? { ...item, attributes: redactAttributes(item.attributes) } : item));

/**
 * Returns a redacted view of `span` without modifying it. The view's prototype
 * is the original span, so `spanContext()`, `resource` and the timings read
 * through, which a plain `{ ...span }` copy would lose.
 */
const redactSpan = (span: ReadableSpan): ReadableSpan =>
  Object.create(span, {
    attributes: { value: redactAttributes(span.attributes), enumerable: true },
    events: { value: redactEach(span.events), enumerable: true },
    links: { value: redactEach(span.links), enumerable: true },
    status: {
      value: span.status.message ? { ...span.status, message: maskText(span.status.message) } : span.status,
      enumerable: true,
    },
  });

/**
 * Wraps the real exporter so spans are redacted on their way out of the
 * process. Doing it at export time covers every instrumentation and every
 * custom attribute in one place, and keeps the work off the request path when
 * the batch processor is in front of it.
 */
export class RedactingSpanExporter implements SpanExporter {
  constructor(private readonly inner: SpanExporter) {}

  export(spans: ReadableSpan[], resultCallback: Parameters<SpanExporter['export']>[1]): void {
    this.inner.export(spans.map(redactSpan), resultCallback);
  }

  shutdown(): Promise<void> {
    return this.inner.shutdown();
  }

  forceFlush(): Promise<void> {
    return this.inner.forceFlush ? this.inner.forceFlush() : Promise.resolve();
  }
}
