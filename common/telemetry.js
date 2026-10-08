/**
 * Entry point for `@ecom-micro/common/telemetry`. It is a separate file, not
 * an export of the main entry, so importing it loads only OpenTelemetry and
 * never Express or the rest of common, which must load after the SDK starts.
 */
module.exports = require('./build/observability/telemetry');
