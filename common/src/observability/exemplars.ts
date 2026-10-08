/**
 * The OTel Prometheus reader emits histogram samples but currently omits
 * exemplars. Add a sampled trace ID to the +Inf bucket when exposing its
 * output as OpenMetrics, so Grafana can link latency points to Tempo.
 *
 * @module exemplars
 */
export type HttpLabels = { service: string; method: string; route: string; statusClass: string };
type Exemplar = { traceId: string; value: number; timestamp: number };

const MAX_SERIES = 1000;
const BUCKET = "http_server_request_duration_bucket{";
const keyOf = ({ service, method, route, statusClass }: HttpLabels): string =>
  JSON.stringify([service, method, route, statusClass]);

const labelsFromBucket = (line: string): HttpLabels | undefined => {
  // Parse only the known histogram bucket. If the upstream exporter changes
  // its text layout, normal metrics still pass through without an exemplar.
  if (!line.startsWith(BUCKET) || !line.includes('le="+Inf"')) return undefined;
  const fields = Object.fromEntries(
    Array.from(line.matchAll(/(service|method|route|status_class)="([^"]*)"/g), (match) => [
      match[1],
      match[2],
    ]),
  );
  if (!fields.service || !fields.method || !fields.route || !fields.status_class) return undefined;
  return {
    service: fields.service,
    method: fields.method,
    route: fields.route,
    statusClass: fields.status_class,
  };
};

export const createExemplarStore = () => {
  const recent = new Map<string, Exemplar>();
  return {
    remember(labels: HttpLabels, traceId: string, value: number): void {
      const key = keyOf(labels);
      recent.delete(key);
      recent.set(key, { traceId, value, timestamp: Date.now() / 1000 });
      // One recent example per series, with a cap in case routes grow.
      if (recent.size > MAX_SERIES) recent.delete(recent.keys().next().value as string);
    },
    render(prometheusText: string): string {
      // The reader's # UNIT lines use OTel names without OpenMetrics unit
      // suffixes. Omitting those lines keeps the exposition valid.
      const lines = prometheusText.split("\n").filter((line) => !line.startsWith("# UNIT "));
      const withExemplars = lines.map((line) => {
        const labels = labelsFromBucket(line);
        const exemplar = labels && recent.get(keyOf(labels));
        return exemplar
          ? `${line} # {trace_id="${exemplar.traceId}"} ${exemplar.value} ${exemplar.timestamp}`
          : line;
      });
      return `${withExemplars.join("\n").trimEnd()}\n# EOF\n`;
    },
  };
};
