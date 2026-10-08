/**
 * These are the strings that stand in for values the logger won't print.
 * Keeping them in one place makes them easy to search for in Grafana.
 */

/** This replaces a secret field or a Stripe key. */
export const REDACTED = '[REDACTED]';

/** This replaces an object that contains itself, such as `node.self = node`. */
export const CIRCULAR = '[Circular]';

/** This replaces anything past the depth or size limit in `redact.ts`. */
export const TRUNCATED = '[Truncated]';

/** This replaces a field whose getter or `toJSON` threw while being read. */
export const UNREADABLE = '[Unreadable]';
