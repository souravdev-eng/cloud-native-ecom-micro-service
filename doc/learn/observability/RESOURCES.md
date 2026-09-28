# Observability Resources

## Knowledge

- [OpenTelemetry: Observability primer](https://opentelemetry.io/docs/concepts/observability-primer/)
  Official definitions of telemetry, logs, spans and distributed traces. Use for: vocabulary, and the "why" of the three signals.
- [Grafana Loki: Understand labels](https://grafana.com/docs/loki/latest/get-started/labels/)
  Streams, labels and why high cardinality is harmful; points to structured metadata. Use for: any "should this be a label?" decision (tickets 02, 04, 15).
- [Grafana Loki: Log queries (LogQL)](https://grafana.com/docs/loki/latest/query/log_queries/)
  Stream selectors, line filters, `| json`, label filters. Use for: writing queries in Grafana Explore.
- [The Twelve-Factor App: XI. Logs](https://12factor.net/logs)
  The "write to stdout, let the platform route it" principle behind ADR 0001. Use for: explaining why the app never talks to Loki.
- [OpenTelemetry: Traces](https://opentelemetry.io/docs/concepts/signals/traces/)
  Span, trace, span kind, status, attributes. Use for: Lesson 4 vocabulary.
- [OpenTelemetry: Context propagation](https://opentelemetry.io/docs/concepts/context-propagation/)
  What context and propagation are. Use for: Lesson 5, and ticket 06 (AMQP propagation).
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
  The `traceparent` format and the sampled flag. Use for: any header-format question.
- [OpenTelemetry: Sampling](https://opentelemetry.io/docs/concepts/sampling/)
  Head vs tail sampling. Use for: the tail-sampling ticket.
- [OpenTelemetry JS: Getting started](https://opentelemetry.io/docs/languages/js/getting-started/nodejs/)
  "Setup must run before your application code." Use for: the import-order rule.
- [Node.js: Asynchronous context tracking](https://nodejs.org/api/async_context.html)
  AsyncLocalStorage, which is how the active span follows a request.
- [Grafana Loki: Structured metadata](https://grafana.com/docs/loki/latest/get-started/labels/structured-metadata/)
  Why `trace_id` isn't a label, and how to filter on it.
- [Grafana Loki: Metric queries](https://grafana.com/docs/loki/latest/query/metric_queries/)
  `count_over_time` and friends. Use for: the dashboards and alerting tickets.
- [Grafana Tempo: Construct TraceQL queries](https://grafana.com/docs/tempo/latest/traceql/construct-traceql-queries/)
  TraceQL examples (service, duration, status).
- [Grafana: Configure the Loki data source](https://grafana.com/docs/grafana/latest/datasources/loki/configure/)
  Derived fields (log → trace link).
- [Grafana: Configure trace to logs](https://grafana.com/docs/grafana/latest/datasources/tempo/configure-tempo-data-source/configure-trace-to-logs/)
  Tag mapping, time shifts, custom query variables.
- [Martin Fowler: Test Double](https://martinfowler.com/bliki/TestDouble.html)
  Fake, stub, spy, mock. Use for: Lesson 7 and reviewing tests.
- ADR 0001 in this repo: `doc/adr/0001-observability-via-otel-and-grafana-lgtm.md`
  Our own decision record and its rejected options. Use for: the "why this design" discussion.
- Spec in this repo: `.scratch/observability-platform/spec.md`
  User stories and implementation decisions for all 18 tickets.

- [Prometheus: Metric types](https://prometheus.io/docs/concepts/metric_types/)
  Counters, gauges and classic histograms. Primary reading for Lesson 9.
- [Prometheus: Histograms and summaries](https://prometheus.io/docs/practices/histograms/)
  Quantiles, bucket precision and aggregation. Use for: reading or reviewing latency queries.
- [Prometheus: Query functions](https://prometheus.io/docs/prometheus/latest/querying/functions/)
  rate and histogram_quantile semantics. Use for: rate-before-sum and resets.
- [Prometheus: Metric and label naming](https://prometheus.io/docs/practices/naming/)
  Bounded metric dimensions. Use for: rejecting raw URLs and IDs as metric labels.
- [OpenTelemetry: HTTP metrics conventions](https://opentelemetry.io/docs/specs/semconv/http/http-metrics/)
  Duration instrument and bounded route templates. Repo uses its own shorter attribute names.
- [Grafana: Exemplars](https://grafana.com/docs/grafana/latest/fundamentals/exemplars/)
  Connecting metric examples to traces. Use for: distinguishing an example from a percentile.
- [Alloy: prometheus.scrape](https://grafana.com/docs/alloy/latest/reference/components/prometheus/prometheus.scrape/)
  Targets, protocols and intervals. Use for: the pull side of ticket 04.
- [Alloy: prometheus.remote_write](https://grafana.com/docs/alloy/latest/reference/components/prometheus/prometheus.remote_write/)
  Forwarding samples and exemplars. Use for: the storage side of ticket 04.

## Wisdom (Communities)

- [Grafana Community forums](https://community.grafana.com/)
  Official forum covering Loki, Tempo, Alloy and Grafana. Use for: config questions and "is this label design sane?"
- [CNCF Slack, #opentelemetry channels](https://slack.cncf.io/)
  Where OTel maintainers answer. Use for: SDK and propagation questions (ticket 06 onwards).

## Gaps

- The lab outputs in Lessons 3–6 still need checking against a running cluster (it was down on 2026-09-27).
- Lesson 9 live dashboard/exemplar lab still needs verification; the local cluster was unavailable on 2026-09-28.
