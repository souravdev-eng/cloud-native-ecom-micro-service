import { dropIndex, logHits, logSection, makeClient } from "../src/client";
import { seedProducts } from "../src/seed";

const INDEX = "ex07_products";

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
        in_stock:    { type: "boolean" },
        popularity:  { type: "integer" },
        createdAt:   { type: "date" }
      }
    }
  });
  await seedProducts(es, INDEX);

  const userQuery = "running";

  logSection("1. Plain BM25 -- text relevance only");
  let res = await es.search({
    index: INDEX,
    size: 8,
    _source: ["title", "popularity", "in_stock", "createdAt"],
    query: {
      multi_match: {
        query: userQuery,
        fields: ["title^3", "description"]
      }
    }
  });
  logHits(res.hits.hits);

  logSection("2. function_score: in_stock + popularity + recency decay");
  res = await es.search({
    index: INDEX,
    size: 8,
    _source: ["title", "popularity", "in_stock", "createdAt"],
    query: {
      function_score: {
        query: {
          multi_match: {
            query: userQuery,
            fields: ["title^3", "description"]
          }
        },
        functions: [
          { filter: { term: { in_stock: true } }, weight: 1.4 },
          {
            field_value_factor: {
              field: "popularity",
              modifier: "log1p",
              missing: 1
            }
          },
          {
            gauss: {
              createdAt: { origin: "now", scale: "60d", decay: 0.5 }
            }
          }
        ],
        score_mode: "sum",
        boost_mode: "multiply"
      }
    }
  });
  logHits(res.hits.hits);

  await dropIndex(es, INDEX);
  await es.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
