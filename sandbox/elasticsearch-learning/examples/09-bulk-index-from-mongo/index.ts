/**
 * SKELETON: Mongo -> Elasticsearch bulk indexer.
 *
 * The data source here is a fake in-memory cursor. Replace
 * `fakeMongoCursor` with `collection.find({}).cursor()` from the real
 * MongoDB driver, and the rest of the code is unchanged.
 *
 * In production, this script is a *backfill / safety-net*. The hot path
 * is event-driven via the outbox pattern (see README).
 */
import { dropIndex, logSection, makeClient } from "../src/client";
import { loadProducts, type Product } from "../src/seed";

const INDEX = "ex09_products";

/** Stand-in for a real MongoDB cursor. */
async function* fakeMongoCursor(): AsyncIterable<Product> {
  const products = loadProducts();
  for (const p of products) {
    // Simulate Mongo's chunked delivery; remove in real code.
    await new Promise((r) => setTimeout(r, 5));
    yield p;
  }
}

async function main(): Promise<void> {
  const es = makeClient();
  await dropIndex(es, INDEX);

  logSection("1. Create destination index with explicit mapping");
  await es.indices.create({
    index: INDEX,
    settings: { number_of_shards: 1, number_of_replicas: 0 },
    mappings: {
      properties: {
        title:       { type: "text" },
        description: { type: "text" },
        brand:       { type: "keyword" },
        category:    { type: "keyword" },
        price:       { type: "scaled_float", scaling_factor: 100 },
        in_stock:    { type: "boolean" },
        popularity:  { type: "integer" },
        createdAt:   { type: "date" }
      }
    }
  });

  logSection("2. Disable refresh for the bulk window");
  await es.indices.putSettings({
    index: INDEX,
    settings: { index: { refresh_interval: "-1" } }
  });

  logSection("3. Stream from (fake) Mongo into helpers.bulk");
  const start = Date.now();
  const result = await es.helpers.bulk({
    datasource: fakeMongoCursor(),
    onDocument: (doc: Product) => ({
      // Idempotent index-by-id: re-running the script is safe.
      index: { _index: INDEX, _id: doc.id }
    }),
    flushBytes: 1_000_000,
    concurrency: 4,
    onDrop(doc) {
      console.error("  dropped:", doc);
    }
  });
  const ms = Date.now() - start;
  console.log(`  successful=${result.successful} failed=${result.failed} retry=${result.retry} took=${ms}ms`);

  logSection("4. Restore refresh + replicas, refresh once");
  await es.indices.putSettings({
    index: INDEX,
    settings: { index: { refresh_interval: "1s", number_of_replicas: 0 } } // 0 because single-node dev
  });
  await es.indices.refresh({ index: INDEX });

  const count = await es.count({ index: INDEX });
  console.log(`  total docs in ES: ${count.count}`);

  logSection("5. Cleanup");
  await dropIndex(es, INDEX);
  await es.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
