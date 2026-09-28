# 16: Alert routing + SLO burn-rate alerts + runbooks

**Parent spec:** `../spec.md`

**What to build:** The on-call engineer gets paged for real customer impact, not noise. Alertmanager routes by `severity` (`page` vs `ticket`) to contact points (email, Slack webhook) configured from the k8s secrets. Silences can be created from Grafana.

Prometheus recording rules compute per-service RED and error-budget burn rates. Each SLO below has multi-window, multi-burn-rate alerts: a fast burn pages, a slow burn raises a ticket.
- Checkout availability: `order` non-5xx on order-create and payment routes, 99.5% over 30 days.
- Checkout latency: p95 under 1s on those routes.
- Storefront availability: `product` non-5xx, 99.5%.
- Auth availability: `auth` login/current-user non-5xx, 99.5%.

SLO status panels on Platform Overview are filled. Every alert carries `service`, `severity`, `summary`, a `runbook_url` and a pre-filtered dashboard link. Runbooks are markdown in the repo, one per alert.

**Blocked by:** 06 (`order` instrumented), 07 (`product` instrumented)

**Status:** ready-for-agent

- [ ] Alertmanager and contact points provisioned from files and secrets; no credentials committed
- [ ] Recording and alert rules pass `promtool check rules`, and a `promtool test rules` case proves fast-burn fires at the expected error ratio
- [ ] Every alert has labels/annotations as specified and a runbook file that exists
- [ ] Platform Overview SLO panels show current error-budget remaining
- [ ] Manual: forcing 5xx on `auth` triggers the fast-burn alert to the configured contact point; a Grafana silence suppresses it
