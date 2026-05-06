import { dropIndex, logHits, logSection, makeClient } from "../src/client";
import { seedProducts } from "../src/seed";

const INDEX = "ex03_products";

async function main(): Promise<void> {
  const es = makeClient();
  await dropIndex(es, INDEX);

  await es.indices.create({
    index: INDEX,
    mappings: {
      properties: {
        title:       { type: "text" },
        description: { type: "text" },
        brand:       { type: "keyword" },
        category:    { type: "keyword" },
        price:       { type: "scaled_float", scaling_factor: 100 },
        tags:        { type: "keyword" },
        in_stock:    { type: "boolean" },
        popularity:  { type: "integer" },
        createdAt:   { type: "date" }
      }
    }
  });
  await seedProducts(es, INDEX);

  logSection("1. must -- text relevance scored");
  let res = await es.search({
    index: INDEX,
    size: 5,
    _source: ["title", "brand", "price"],
    query: { bool: { must: [{ match: { title: "running shoes" } }] } }
  });
  logHits(res.hits.hits);

  logSection("2. filter -- same intent, no score (note _score=0)");
  res = await es.search({
    index: INDEX,
    size: 5,
    _source: ["title", "brand", "price"],
    query: { bool: { filter: [{ term: { category: "shoes" } }] } }
  });
  logHits(res.hits.hits);

  logSection("3. must + filter -- text relevance, narrowed by category and price");
  res = await es.search({
    index: INDEX,
    size: 5,
    _source: ["title", "brand", "price"],
    query: {
      bool: {
        must:   [{ match: { title: "running" } }],
        filter: [
          { term:  { category: "apparel" } },
          { range: { price: { lte: 30 } } }
        ]
      }
    }
  });
  logHits(res.hits.hits);

  logSection("4. must_not -- exclude out-of-stock");
  res = await es.search({
    index: INDEX,
    size: 5,
    _source: ["title", "in_stock"],
    query: {
      bool: {
        must:     [{ match: { title: "speaker" } }],
        must_not: [{ term:   { in_stock: false } }]
      }
    }
  });
  logHits(res.hits.hits);

  logSection("5. should -- bonus for matching tag, not required");
  res = await es.search({
    index: INDEX,
    size: 5,
    _source: ["title", "tags"],
    query: {
      bool: {
        must:   [{ match: { description: "kitchen" } }],
        should: [{ term:  { tags: "coffee" } }],
        minimum_should_match: 0
      }
    }
  });
  logHits(res.hits.hits);

  await dropIndex(es, INDEX);
  await es.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
