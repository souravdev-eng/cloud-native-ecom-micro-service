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
- ADR 0001 in this repo: `doc/adr/0001-observability-via-otel-and-grafana-lgtm.md`
  Our own decision record and its rejected options. Use for: the "why this design" discussion.
- Spec in this repo: `.scratch/observability-platform/spec.md`
  User stories and implementation decisions for all 18 tickets.

## Wisdom (Communities)

- [Grafana Community forums](https://community.grafana.com/)
  Official forum covering Loki, Tempo, Alloy and Grafana. Use for: config questions and "is this label design sane?"
- [CNCF Slack, #opentelemetry channels](https://slack.cncf.io/)
  Where OTel maintainers answer. Use for: SDK and propagation questions (ticket 06 onwards).

## Gaps

- Tempo, W3C Trace Context and the OTel JS SDK sources still need to be verified before lessons 3–5.
