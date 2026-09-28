/**
 * The defaults for "which build is this, and where is it running". The logger
 * and the telemetry bootstrap both use them, so a log line's `version` and
 * `environment` always match the `service.version` and `deployment.environment`
 * on the same request's spans.
 */

/** The version falls back to `SERVICE_VERSION`, the npm package version, then `unknown`. */
export const defaultVersion = (): string =>
  process.env.SERVICE_VERSION || process.env.npm_package_version || 'unknown';

/** The environment falls back to `DEPLOYMENT_ENVIRONMENT`, `NODE_ENV`, then `development`. */
export const defaultEnvironment = (): string =>
  process.env.DEPLOYMENT_ENVIRONMENT || process.env.NODE_ENV || 'development';
