# 02: Logs pillar: structured `auth` logs searchable in Grafana

**Parent spec:** `../spec.md`

**What to build:** A developer triggers an `auth` login in the local cluster, opens Grafana, and finds a structured JSON log line for it in Loki, filterable by `service` and `level`. This is the first end-to-end slice and it proves the logging path from app stdout → Alloy → Loki → Grafana.

Common gains the **logger factory**:
- JSON to stdout with the fixed schema (timestamp, level, service, version, environment, message, error name/message/stack, arbitrary structured fields);
- pretty output when `NODE_ENV=development`;
- level from `LOG_LEVEL`;
- a redaction formatter that masks deny-listed keys (password, token, authorization, cookie, jwt, secret, Stripe keys, card data) and masks email addresses.

The existing `winstonLogger(elasticSearchNode, name, level)` becomes a deprecated wrapper over the factory. It ignores the Elasticsearch argument and no longer ships logs to Elasticsearch. Common is published as 2.1.0 and `auth` bumps to it.

On the platform side, add the observability manifest group with:
- Alloy tailing pod stdout and parsing JSON, with only `level` and `service` as Loki labels;
- Loki in single-binary mode on a PV;
- Grafana with Loki provisioned as a datasource, admin credentials from the k8s secrets, anonymous access disabled;
- a new `observability` skaffold profile layered on `minimal`.

This ticket implements ADR 0001 (Observability via OpenTelemetry + Grafana LGTM; Elasticsearch reserved for product search) in the system-wide ADR folder. Read it first.

**Blocked by:** 01 (common test harness)

**Status:** ready-for-agent

- [ ] Common tests: a log call produces exactly one JSON line with every schema field; `LOG_LEVEL` filters lower levels; development mode produces non-JSON pretty output
- [ ] Common tests: fields named password/token/authorization/cookie and email addresses never appear unmasked in output
- [ ] Common tests: the deprecated `winstonLogger` wrapper returns a working logger writing the new schema and makes no Elasticsearch calls
- [ ] Common published as 2.1.0; `auth` depends on `^2.1.0` and its existing test suite passes
- [ ] `skaffold dev -p observability` brings up Alloy, Loki and Grafana with requests/limits set; `minimal` is unchanged
- [ ] Grafana is reachable via port-forward, requires login, and has the Loki datasource provisioned from files (no manual setup)
- [ ] An `auth` login is findable in Grafana Explore by `{service="auth-service"}` and `level`
