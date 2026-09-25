# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

This repo is **multi-context**: each backend service is its own bounded context with its own datastore, connected through RabbitMQ events.

## Before exploring, read these

- **`CONTEXT-MAP.md`** at the repo root: it points at one `CONTEXT.md` per context. Read each one relevant to the topic.
- **`doc/adr/`**: system-wide decisions (event contracts, the `@ecom-micro/common` package, datastore choices, cross-service flows). Read ADRs that touch the area you're about to work in.
- **`<svc>/doc/adr/`**: decisions scoped to one service (e.g. `product/doc/adr/`). Check the one for the service you're working in.

Note the folder is `doc/` (singular), matching the repo's existing `doc/engineering/` and `doc/tracking/`. Only the agent config lives under `docs/agents/`.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── CONTEXT-MAP.md                     ← points at each context's CONTEXT.md
├── doc/adr/                           ← system-wide decisions
├── auth/
│   ├── CONTEXT.md
│   └── doc/adr/                       ← context-specific decisions
├── product/        (same shape)
├── cart/           (same shape)
├── order/          (same shape)
├── notification/   (same shape)
├── etl-service/    (same shape)
├── review/         (same shape)
├── common/
│   └── CONTEXT.md                     ← shared kernel: event and error terms used across contexts
└── mfe-client/
    └── CONTEXT.md                     ← the frontend as one context
```

Terms defined in `common/CONTEXT.md` (event names, error types) are shared across every context. When a service's glossary uses the same word differently, the service's `CONTEXT.md` should say so explicitly.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in the relevant `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
