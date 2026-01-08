import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpRequestDuration, httpErrorsTotal, activeConnections } from './metrics';

// Middleware to track HTTP metrics
export const metricsMiddleware = (serviceName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();

        // Track active connections
        activeConnections.inc({ service: serviceName });

        // Capture the original end function
        const originalEnd = res.end;

        res.end = function (...args: any[]) {
            // Calculate duration
            const duration = (Date.now() - start) / 1000;

            // Get route pattern (e.g., /users/:id instead of /users/123)
            const route = req.route?.path || req.path || 'unknown';

            // Record metrics
            httpRequestsTotal.inc({
                method: req.method,
                route,
                status_code: res.statusCode.toString(),
                service: serviceName,
            });

            httpRequestDuration.observe(
                {
                    method: req.method,
                    route,
                    status_code: res.statusCode.toString(),
                    service: serviceName,
                },
                duration
            );

            // Track errors
            if (res.statusCode >= 400) {
                const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
                httpErrorsTotal.inc({
                    method: req.method,
                    route,
                    error_type: errorType,
                    service: serviceName,
                });
            }

            // Decrement active connections
            activeConnections.dec({ service: serviceName });

            // Call the original end function
            originalEnd.apply(res, args);
        };

        next();
    };
};

// Middleware to expose metrics endpoint
export const metricsEndpoint = (register: any) => {
    return async (req: Request, res: Response) => {
        try {
            res.set('Content-Type', register.contentType);
            const metrics = await register.metrics();
            res.end(metrics);
        } catch (error) {
            res.status(500).end();
        }
    };
};
