# 01: Common test harness + characterise the messaging base classes

**Parent spec:** `../spec.md`

**What to build:** `@ecom-micro/common` has no tests. This prefactor gives it a Jest + supertest setup and an in-memory fake RabbitMQ channel. The fake records `assertExchange` / `publish` calls and lets a test deliver a message to a registered consumer callback. With those in place, add characterisation tests that pin down how `BasePublisher` and `BaseListener` behave today, using subclasses defined inside the tests:

- the publisher asserts a durable direct exchange and publishes a persistent JSON buffer to the routing key;
- the listener asserts and binds a durable queue with prefetch 1 and parses the JSON before calling `onMessage`.

These are the safety net for the tracing changes in ticket 06. They're also where the later observability tests will live (the single test seam agreed in the spec).

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Common has a test script that runs Jest once (no watch mode), and a test build that doesn't leak into the published `build/` output
- [ ] A reusable fake AMQP channel test helper exists and is usable from any common test
- [ ] Characterisation tests cover publisher exchange assertion, message payload and routing key, and persistence flag
- [ ] Characterisation tests cover listener queue assertion/binding, prefetch, JSON parsing and delivery to `onMessage`
- [ ] Tests assert only on observable calls to the channel and data handed to `onMessage`, not on private fields
- [ ] No behaviour change to the published package
