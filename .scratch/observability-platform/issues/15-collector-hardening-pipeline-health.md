# 15: Collector hardening + Observability Pipeline Health dashboard

**Parent spec:** `../spec.md`

**What to build:** The telemetry pipeline becomes production-shaped and reports on its own health. Alloy gains:
- a **second redaction layer**: attribute and log processors masking the deny-list keys, plus regexes for bearer tokens, JWT-shaped strings and `token=` query strings;
- **tail sampling** that keeps 100% of error traces and traces over a latency threshold, and a configurable ratio of the rest (dev 100%, prod default 10%).

Retention per signal (Loki 7d, Tempo 72h, Prometheus 15d locally) and the sampling ratio become per-environment config. Every observability component has verified requests/limits.

An **Observability Pipeline Health** dashboard shows:
- collector accepted, refused and dropped spans and log lines, and queue sizes;
- Loki ingestion errors;
- Prometheus scrape targets up/down.

**Blocked by:** 04 (metrics pillar)

**Status:** ready-for-agent

- [ ] A log line or span attribute containing a bearer token, a JWT or `?token=abc` arrives in Loki/Tempo masked, even when emitted by a raw `console.log` that skipped the SDK redaction
- [ ] With the prod ratio set, fast successful traces are sampled while every error trace and every slow trace is kept
- [ ] Retention and sampling values come from per-environment config, not hardcoded
- [ ] Pipeline Health dashboard provisioned, passes validation, and shows drops when Tempo is scaled to zero
