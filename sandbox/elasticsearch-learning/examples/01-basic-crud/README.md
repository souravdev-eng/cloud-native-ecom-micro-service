# 01 — Basic CRUD

Create an index, index a few docs, get one, update one, search them,
delete one, drop the index.

The point: see the full lifecycle in 60 lines, including the **refresh
gotcha** (writes are not searchable until refresh).

## Run

```bash
docker compose -f ../../docker-compose.yml up -d
npm install
npm run basic-crud
```

## What to notice

- We call `client.indices.refresh()` after writes; without it, the
  search step finds 0 docs.
- `index` upserts (replaces by `_id`); `create` would fail if the doc
  already existed.
- `update` uses a partial doc; the rest of the document is untouched.
