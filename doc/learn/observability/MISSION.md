# Mission: The ecom observability platform (Grafana LGTM + OpenTelemetry)

## Why
Tickets 01–03 of `.scratch/observability-platform/` were built faster than I could absorb them, and 04–18 are next. I want to own this platform, not just have it: steer the remaining tickets, change it myself, debug real incidents with it, and explain it to others.

## Success looks like
- I can trace one `auth` request from `logger.warn(...)` or the incoming HTTP call all the way to Grafana, naming every hop and the file that configures it.
- I can review a PR for tickets 04–18 and catch a wrong design choice (e.g. a high-cardinality label, a missing `traceparent`, telemetry that can block a request).
- I can change the logger, the telemetry bootstrap or the Alloy/Loki/Tempo/Grafana config without help.
- Given a symptom (a slow login, a `webhook_pending` checkout), I can find the logs and trace for it in Grafana.
- I can explain the design and its trade-offs (ADR 0001) in plain words to a teammate.

## Constraints
- Starting from near zero: logs are familiar, but traces, spans, OTel, Alloy, Loki and Tempo are new.
- About 20 minutes per lesson.
- Lessons are hands-on against the local cluster (`skaffold dev -p observability`).

## Out of scope
- Ticket-by-ticket prep for 04–18. That comes after 01–03 are solid.
- Managed SaaS observability (Datadog, Grafana Cloud) and running Loki/Tempo at production scale.
