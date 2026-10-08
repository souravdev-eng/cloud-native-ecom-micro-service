# 06: Checkout traced across RabbitMQ (`order` → `cart`)

**Parent spec:** `../spec.md`

**What to build:** A developer places an order and sees **one trace** in Grafana. It runs from the `order` HTTP request (including the Stripe outbound call and Mongo) through the RabbitMQ publish to `cart`'s `OrderCreatedListener` clearing the cart in Postgres. If the listener throws, its consumer span is marked as an error and an error log with the same `trace_id` sits next to it.

Common's messaging base classes gain built-in propagation, so services don't change their publisher or listener subclasses:
- `BasePublisher` injects W3C `traceparent`/`tracestate` into AMQP message headers and records a producer span (exchange, routing key, message size).
- `BaseListener` extracts the context and runs `onMessage` inside a child consumer span with exchange, routing key and outcome. It **awaits** `onMessage` so thrown errors reach the span. It records consume duration and a failure counter.
- Both classes use the structured logger instead of `console.log`.

`order` and `cart` adopt the full contract:
- bootstrap first in the entry file;
- `console.log` replaced by the shared logger;
- middleware bundle mounted;
- health routes with their datastore and RabbitMQ checks;
- k8s probes, OTel env vars and scrape annotations;
- dependency bumped to the new common version.

Check each existing listener for reliance on fire-and-forget `onMessage` (prefetch is 1, so awaiting serialises what is already effectively serial).

**Blocked by:** 03 (traces pillar), 04 (metrics pillar), 05 (health contract)

**Status:** ready-for-agent

- [ ] Common tests (fake channel + in-memory exporter): a published message carries a `traceparent` header; delivering it yields a consumer span whose parent is the producer span in the same trace
- [ ] Common tests: a listener whose `onMessage` throws yields an error-status consumer span and one error-level log line with that trace_id
- [ ] Ticket 01's characterisation tests still pass, or are updated only where the spec intends a change (awaited `onMessage`, logger instead of console)
- [ ] New common version published; `order` and `cart` bumped
- [ ] `cart` gains smoke tests for `/healthz` and `/metrics`; existing `cart` tests pass (`order` has no test scaffolding; don't add any)
- [ ] No `console.log` left in `order` or `cart` source
- [ ] Manual: placing an order through the MFE produces one Tempo trace spanning `order` → RabbitMQ → `cart` listener, with log links working
