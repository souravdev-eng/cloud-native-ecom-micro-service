import { createLogger } from '@ecom-micro/common';

/**
 * The logger writes JSON lines to stdout, which Alloy ships to Loki. Grafana
 * finds them with `{service="auth-service"}`, and `LOG_LEVEL` sets verbosity.
 */
export const logger = createLogger({ service: 'auth-service' });
