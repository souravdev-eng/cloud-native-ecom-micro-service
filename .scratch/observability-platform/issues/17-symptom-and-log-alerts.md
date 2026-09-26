# 17: Symptom and log-based alerts + runbooks

**Parent spec:** `../spec.md`

**What to build:** Failures that SLOs don't catch still reach the on-call engineer.

Symptom alerts:
- a queue backlog growing for 10 minutes;
- consumer error rate above threshold;
- stuck-payment gauge above threshold;
- ETL last-successful-sync older than 2× its cron interval;
- email failure ratio above threshold;
- pod CrashLoopBackOff / OOMKilled;
- readiness failing for 5 minutes;
- a scrape target down.

A Grafana-managed **log-based alert** fires on a sustained spike in `level=error` lines per service. Each alert follows the ticket 16 conventions (labels, `runbook_url`, dashboard link) and has its own runbook.

**Blocked by:** 12 (Event Flow / queue metrics), 13 (stuck-payment and email metrics), 14 (ETL freshness metric), 15 (pipeline health / scrape metrics)

**Status:** ready-for-agent

- [ ] All listed alert rules exist, pass `promtool check rules`, and have `promtool test rules` cases for backlog growth and stale ETL
- [ ] Log-based error-spike alert provisioned in Grafana from files
- [ ] Every alert has a runbook file and a dashboard link that opens pre-filtered
- [ ] Manual: stopping the `cart` consumer fires the backlog alert after the configured window
