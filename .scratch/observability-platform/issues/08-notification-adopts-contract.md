# 08: `notification` adopts the full observability contract

**Parent spec:** `../spec.md`

**What to build:** When an event triggers an email, the `notification` consumer span and the SMTP send appear inside the originating trace (for example a password reset from `auth`, or an order event). Failures show as error spans with linked error logs.

`notification` gets no inbound HTTP traffic, so it serves only `/metrics` and the health routes (RabbitMQ check plus an SMTP transporter check if cheap).

Adoption:
- bootstrap first;
- `console.log` replaced;
- k8s probes, OTel env vars and scrape annotations;
- dependency bumped.

Email addresses in logs must be masked by the logger's redaction.

**Blocked by:** 06 (messaging propagation shipped in common)

**Status:** ready-for-agent

- [ ] `notification` depends on the latest common and starts cleanly in the `backend` profile
- [ ] `/healthz`, `/readyz` and `/metrics` respond; probes configured (no test scaffolding exists here, so none is added)
- [ ] No `console.log` left in `notification` source; recipient emails appear masked in Loki
- [ ] Manual: an email-producing event shows the `notification` consumer span as a child of the publisher's trace
