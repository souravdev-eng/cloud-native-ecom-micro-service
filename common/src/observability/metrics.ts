import { metrics, trace } from "@opentelemetry/api";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { MeterProvider } from "@opentelemetry/sdk-metrics";
import type { Request, Response } from "express";
import type { ServerResponse } from "http";
// perf_hooks is a built-in Node.js module, no need to install, it's used for performance monitoring
import { monitorEventLoopDelay, PerformanceObserver } from "perf_hooks";
import { createExemplarStore } from "./exemplars";
import { defaultEnvironment } from "./serviceInfo";

type RequestSample = {
  method: string;
  route: string;
  statusClass: string;
  seconds: number;
  sampledTraceId?: string;
};
type MetricState = {
  record(sample: RequestSample): void;
  serve(req: Request, res: Response): void;
};

// Each service runs in its own Node process, so one reader serves all of its
// HTTP and business metrics.
let state: MetricState | undefined;

/**
 * The package root is imported by all Node services. Initialize process
 * observers only when a service mounts metrics or creates a business meter.
 */
export const httpMetrics = (service: string): MetricState => {
  if (state) return state;

  // Use the service's existing Express port instead of the exporter's own
  // server. It supplies the metric reader and we supply the /metrics route.
  const exporter = new PrometheusExporter({ preventServerStart: true, withoutScopeInfo: true });
  metrics.setGlobalMeterProvider(new MeterProvider({ readers: [exporter] }));

  const meter = metrics.getMeter("@ecom-micro/common");
  const environment = defaultEnvironment();
  const runtimeLabels = { service, environment };

  const duration = meter.createHistogram("http.server.request.duration", {
    description: "Duration of inbound HTTP requests",
    unit: "s",
    advice: { explicitBucketBoundaries: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] },
  });

  const exemplars = createExemplarStore();

  const eventLoop = monitorEventLoopDelay({ resolution: 20 });
  eventLoop.enable();
  meter.createObservableGauge("nodejs.eventloop.lag", { unit: "s" }).addCallback((result) => {
    // monitorEventLoopDelay reports nanoseconds; the metric uses seconds.
    result.observe(eventLoop.mean / 1e9 || 0, runtimeLabels);
  });
  meter.createObservableGauge("nodejs.heap.used", { unit: "By" }).addCallback((result) => {
    result.observe(process.memoryUsage().heapUsed, runtimeLabels);
  });

  const gcDuration = meter.createHistogram("nodejs.gc.duration", {
    unit: "s",
    advice: {
      explicitBucketBoundaries: [0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
    },
  });

  const gcObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // PerformanceObserver uses milliseconds; OTel histograms use seconds.
      const kind = (entry as typeof entry & { kind?: number }).kind;
      gcDuration.record(entry.duration / 1000, {
        ...runtimeLabels,
        kind: String(kind || "unknown"),
      });
    }
  });

  gcObserver.observe({ entryTypes: ["gc"] });

  state = {
    record(sample): void {
      duration.record(sample.seconds, {
        service,
        environment,
        method: sample.method,
        route: sample.route,
        status_class: sample.statusClass,
      });
      if (sample.sampledTraceId) {
        exemplars.remember({ service, ...sample }, sample.sampledTraceId, sample.seconds);
      }
    },
    serve(req, res): void {
      // The reader expects a Node ServerResponse. Capture its text in a
      // small adapter, then send OpenMetrics through the real Express response.
      const sink = {
        statusCode: 200,
        setHeader: () => sink,
        end: (body: string) => {
          res.status(sink.statusCode);
          if (sink.statusCode !== 200) {
            res.end(body);
            return;
          }
          res.setHeader(
            "Content-Type",
            "application/openmetrics-text; version=1.0.0; charset=utf-8",
          );
          res.send(exemplars.render(body));
        },
      } as unknown as ServerResponse;
      exporter.getMetricsRequestHandler(req, sink);
    },
  };
  return state;
};

/** Business instruments share the provider that /metrics scrapes. */
export const getServiceMeter = (service: string) => {
  httpMetrics(service);
  return metrics.getMeter(service);
};

/** Custom spans use the tracing bootstrap's provider. */
export const getServiceTracer = (service: string) => trace.getTracer(service);
