import { dropIndex, logHits, logSection, makeClient } from "../src/client";

const INDEX = "ex01_products";

async function main(): Promise<void> {
  const es = makeClient();
  await dropIndex(es, INDEX);

  logSection("1. Create index with explicit mapping");
  await es.indices.create({
    index: INDEX,
    mappings: {
      properties: {
        title:    { type: "text" },
        brand:    { type: "keyword" },
        price:    { type: "scaled_float", scaling_factor: 100 }
      }
    }
  });
  console.log(`  created index ${INDEX}`);

  logSection("2. Index three documents");
  await es.index({ index: INDEX, id: "p_1", document: { title: "Red Running Shoes",   brand: "Acme",    price: 89.99 } });
  await es.index({ index: INDEX, id: "p_2", document: { title: "Blue Running Socks",  brand: "Acme",    price: 14.99 } });
  await es.index({ index: INDEX, id: "p_3", document: { title: "Leather Wallet",      brand: "Initech", price: 39.00 } });

  logSection("3. Search BEFORE refresh -- expect 0 hits");
  let res = await es.search({ index: INDEX, query: { match: { title: "running" } } });
  console.log(`  hits: ${res.hits.hits.length}  (writes not yet visible)`);

  logSection("4. Refresh, then search again");
  await es.indices.refresh({ index: INDEX });
  res = await es.search({ index: INDEX, query: { match: { title: "running" } } });
  console.log(`  hits: ${res.hits.hits.length}`);
  logHits(res.hits.hits);

  logSection("5. Get one document by id");
  const got = await es.get({ index: INDEX, id: "p_1" });
  console.log(`  ${got._id} ->`, got._source);

  logSection("6. Partial update -- price drop");
  await es.update({ index: INDEX, id: "p_1", doc: { price: 79.99 } });
  await es.indices.refresh({ index: INDEX });
  const updated = await es.get({ index: INDEX, id: "p_1" });
  console.log(`  ${updated._id} ->`, updated._source);

  logSection("7. Delete one document");
  await es.delete({ index: INDEX, id: "p_3" });
  await es.indices.refresh({ index: INDEX });
  const count = await es.count({ index: INDEX });
  console.log(`  remaining docs: ${count.count}`);

  logSection("8. Drop the index (cleanup)");
  await dropIndex(es, INDEX);
  console.log("  done");

  await es.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
