import winston, { Logger } from 'winston';
import { redact } from './redact';

const { format } = winston;

export interface LoggerOptions {
  /** The `service` field and Loki `service` label, such as `auth-service`. */
  service: string;
  /** The version falls back to `SERVICE_VERSION`, the npm package version, then `unknown`. */
  version?: string;
  /** The environment falls back to `DEPLOYMENT_ENVIRONMENT`, `NODE_ENV`, then `development`. */
  environment?: string;
  /** The level falls back to `LOG_LEVEL`, then `info`; it must be a Winston npm level. */
  level?: string;
}

/**
 * Winston's default "npm" levels, most to least severe: error, warn, info,
 * http, verbose, debug, silly. A logger drops entries below its level.
 */
const LEVELS = Object.keys(winston.config.npm.levels);
const DEFAULT_LEVEL = 'info';

/** Fields every JSON line carries, in the order they are written. */
const SCHEMA_FIELDS = ['timestamp', 'level', 'service', 'version', 'environment', 'message'];

/**
 * An `Error`'s `name`, `message` and `stack` are non-enumerable, so
 * `JSON.stringify` would turn it into `{}`. This copies them into a plain object.
 */
const errorFields = (error: Error) => ({ name: error.name, message: error.message, stack: error.stack });

/**
 * Turns errors into the schema's `error: { name, message, stack }` object.
 * It handles both `logger.error(err)`, where Winston passes the Error itself
 * as the log entry, and `logger.error('msg', { error: err })`.
 */
const normaliseErrors = format((info) => {
  /**
   * Spreading copies Winston's internal Symbol keys (level, splat) along
   * with the ordinary fields; Winston needs those later in the pipeline.
   */
  const entry: Record<string | symbol, any> = { ...info };

  if (info instanceof Error) {
    entry.message = info.message;
    entry.error = errorFields(info);
  } else if (typeof info.stack === 'string' && entry.error === undefined) {
    /** When called as `logger.error('msg', err)`, Winston copies only the stack onto the entry. */
    entry.error = { name: 'Error', message: info.message, stack: info.stack };
    delete entry.stack;
  }

  for (const key of Object.keys(entry)) {
    if (entry[key] instanceof Error) entry[key] = errorFields(entry[key]);
  }
  return entry as winston.Logform.TransformableInfo;
});

/**
 * Masks secret fields, emails and Stripe keys (see `redact.ts`). `redact`
 * returns a copy with only string keys, so Winston's Symbol keys are put back afterwards.
 */
const redactSecrets = format((info) => {
  const entry = redact(info) as Record<string | symbol, unknown>;
  for (const symbol of Object.getOwnPropertySymbols(info)) {
    entry[symbol] = (info as any)[symbol];
  }
  return entry as winston.Logform.TransformableInfo;
});

/**
 * Stamps the fixed schema fields and orders them first, so every line starts
 * with the same keys. They are applied last so a caller's own `service` or
 * `timestamp` field can't overwrite the real one.
 */
const applySchema = (fixed: { service: string; version: string; environment: string }) =>
  format((info) => {
    /**
     * Assigning onto an object that already has the keys keeps their original
     * position, so the schema fields stay first even after `info` is merged in.
     */
    const stamped = { timestamp: new Date().toISOString(), ...fixed };
    const ordered = { timestamp: '', level: '', ...fixed, message: '' };
    return Object.assign(ordered, info, stamped) as winston.Logform.TransformableInfo;
  })();

/**
 * Pretty, colourised single-line output for a developer's terminal, e.g.
 * `2026-09-26T10:00:00.000Z info [auth-service] started {"port":3000}`,
 * with the stack trace on the following lines when there is an error.
 */
const prettyLine = format.printf((info) => {
  const extra = Object.fromEntries(Object.entries(info).filter(([key]) => !SCHEMA_FIELDS.includes(key) && key !== 'error'));
  const fields = Object.keys(extra).length > 0 ? ` ${JSON.stringify(extra)}` : '';
  const { error } = info as { error?: { stack?: string } };
  const stack = error?.stack ? `\n${error.stack}` : '';
  return `${info.timestamp} ${info.level} [${info.service}] ${info.message}${fields}${stack}`;
});

/**
 * JSON unless we're in local development. `LOG_FORMAT` overrides this,
 * because the local k8s cluster runs with `NODE_ENV=development` but Alloy
 * needs JSON to extract the `level` and `service` labels.
 */
const usePrettyOutput = (): boolean => {
  const explicit = process.env.LOG_FORMAT?.toLowerCase();
  if (explicit === 'json') return false;
  if (explicit === 'pretty') return true;
  return process.env.NODE_ENV === 'development';
};

/**
 * Creates the platform's standard logger, which writes one redacted JSON line
 * per entry to stdout. In the cluster Alloy ships those lines to Loki, so the
 * app never talks to a log backend over the network.
 */
export const createLogger = (options: LoggerOptions): Logger => {
  const requestedLevel = options.level || process.env.LOG_LEVEL || DEFAULT_LEVEL;
  const level = LEVELS.includes(requestedLevel) ? requestedLevel : DEFAULT_LEVEL;

  const fixed = {
    service: options.service,
    version: options.version || process.env.SERVICE_VERSION || process.env.npm_package_version || 'unknown',
    environment: options.environment || process.env.DEPLOYMENT_ENVIRONMENT || process.env.NODE_ENV || 'development',
  };

  /**
   * Order matters: errors become plain objects before redaction so their
   * message and stack get masked too, and the schema fields are added after
   * redaction so nothing can mask them.
   */
  const pipeline = [normaliseErrors(), redactSecrets(), applySchema(fixed)];

  /**
   * `deterministic: false` stops logform sorting keys alphabetically, so the
   * schema order from `applySchema` survives into the written line.
   */
  const jsonLine = format.json({ deterministic: false });
  const output = usePrettyOutput() ? [format.colorize({ level: true }), prettyLine] : [jsonLine];

  const logger = winston.createLogger({
    level,
    exitOnError: false,
    format: format.combine(...pipeline, ...output),
    /**
     * A Stream transport on stdout, not the Console transport: Console writes
     * through `console`, which Jest and other tools replace, while
     * `process.stdout` is exactly what the container runtime captures.
     */
    transports: [new winston.transports.Stream({ stream: process.stdout })],
  });

  if (level !== requestedLevel) {
    logger.warn(`Unknown log level "${requestedLevel}", falling back to "${DEFAULT_LEVEL}"`, { validLevels: LEVELS });
  }
  return logger;
};
