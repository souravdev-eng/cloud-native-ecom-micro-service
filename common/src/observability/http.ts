import { context, trace, TraceFlags } from "@opentelemetry/api";
import type { Express, Request } from "express";
import { traceIdHeader } from "../middleware/traceIdHeader";
import { createLogger } from "./logger";
import { httpMetrics } from "./metrics";
import { REDACTED } from "./placeholders";
import { isSensitiveKey } from "./sensitiveKeys";

/** Redact query values before handing the URL to the structured logger. */
const maskedUrl = (originalUrl: string): string => {
  try {
    const url = new URL(originalUrl, "http://localhost");
    for (const key of url.searchParams.keys()) {
      if (isSensitiveKey(key)) url.searchParams.set(key, REDACTED);
    }
    return `${url.pathname}${url.search}`;
  } catch {
    // A malformed URL should neither leak its query nor break the response.
    return "[invalid URL]";
  }
};

/** Route templates are bounded; raw paths can contain IDs and explode cardinality. */
const routeTemplate = (req: Request): string => {
  const path = req.route?.path;
  // Express has no matched route for 404s, so group them under one label.
  return typeof path === "string" && path !== "*" ? path : "unmatched";
};

/** Call once before service routes to mount tracing headers, request signals and /metrics. */
export const mountObservability = (app: Express, options: { service: string }): void => {
  const logger = createLogger(options);
  const instruments = httpMetrics(options.service);

  // Mount the trace ID header middleware to propagate trace IDs
  app.use(traceIdHeader);

  // Mount the request logging and metrics middleware
  app.use((req, res, next) => {
    const started = process.hrtime.bigint();
    // Capture while the request span is active. It may be gone when the
    // response's finish event runs.
    const span = trace.getSpan(context.active())?.spanContext();

    // Log when the request is finished and record metrics
    res.once("finish", () => {
      const seconds = Number(process.hrtime.bigint() - started) / 1e9;
      const route = routeTemplate(req);
      if (req.path !== "/metrics") {
        // Scrapes should not count as application traffic. The final route
        // and status are available only after Express finishes the request.
        instruments.record({
          method: req.method,
          route,
          statusClass: `${Math.floor(res.statusCode / 100)}xx`,
          seconds,
          sampledTraceId: span && span.traceFlags & TraceFlags.SAMPLED ? span.traceId : undefined,
        });
      }

      // Log the request
      logger.info("HTTP request", {
        method: req.method,
        route,
        status: res.statusCode,
        duration_seconds: seconds,
        url: maskedUrl(req.originalUrl),
      });
    });
    next();
  });

  // Mount the metrics endpoint
  app.get("/metrics", instruments.serve);
};
