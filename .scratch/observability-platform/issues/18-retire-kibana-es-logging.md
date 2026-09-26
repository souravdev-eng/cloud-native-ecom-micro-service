# 18: Retire Kibana and the Elasticsearch logging path

**Parent spec:** `../spec.md`

**What to build:** Elasticsearch goes back to one job, product search, and logging can no longer slow customer search. `winston-elasticsearch` is removed from common's dependencies; the deprecated `winstonLogger` wrapper stays, since it no longer uses it. Kibana is removed from the `full` skaffold profile, which now includes the `observability` stack. Any leftover Elasticsearch config used only for logging (e.g. in `auth`) is removed, while search config for `product` and `etl-service` stays.

**Blocked by:** 02 (logs pillar), 06 (`order`/`cart` adopted), 07 (`product` adopted), 08 (`notification` adopted), 09 (`etl-service` adopted)

**Status:** ready-for-agent

- [ ] Common no longer depends on `winston-elasticsearch`; new version published; all Node services on it and their tests pass
- [ ] No service sends logs to Elasticsearch (no log indices created in Elasticsearch during a checkout run)
- [ ] `skaffold dev -p full` runs without Kibana and includes the observability stack
- [ ] Product search and ETL product sync still work against Elasticsearch
- [ ] Outcome matches ADR 0001 (Kibana out of observability, Elasticsearch serves search only); if anything deviates, record a superseding ADR
