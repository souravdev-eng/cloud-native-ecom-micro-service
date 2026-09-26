# 12: Event Flow dashboard + service dependency graph

**Parent spec:** `../spec.md`

**What to build:** An on-call engineer opens **Event Flow** and sees, per exchange and queue:
- publish rate and consume rate;
- queue depth and unacked messages;
- consumer error rate;
- producer→consumer latency.

A stuck consumer (e.g. `cart`'s `OrderCreatedListener`) is then visible before messages pile up. Tempo's metrics generator (span metrics + service graph, remote-written to Prometheus) powers a live **service dependency graph** in Grafana built from real traces.

Enable RabbitMQ's built-in Prometheus plugin in its manifest and scrape it. Fill the RabbitMQ summary on Platform Overview.

**Blocked by:** 06 (consumer spans and metrics), 11 (Platform Overview exists)

**Status:** ready-for-agent

- [ ] RabbitMQ Prometheus plugin enabled and scraped
- [ ] Event Flow dashboard shows per-queue depth, unacked, publish/consume rates and consumer error rate
- [ ] Stopping the `cart` pod makes its queue depth visibly grow on the dashboard
- [ ] Grafana service graph shows `order` → `cart` edges from real traces
- [ ] Platform Overview RabbitMQ summary is populated
