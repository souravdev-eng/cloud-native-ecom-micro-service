import { dropIndex, logHits, logSection, makeClient } from "../src/client";
import { seedProducts } from "../src/seed";

const INDEX = "ex04_products";

async function main(): Promise<void> {
  const es = makeClient();
  await dropIndex(es, INDEX);

  await es.indices.create({
    index: INDEX,
    settings: {
      analysis: {
        analyzer: {
          search_text: {
            type: "custom",
            tokenizer: "standard",
            filter: ["lowercase", "asciifolding"]
          }
        }
      }
    },
    mappings: {
      properties: {
        title:       { type: "text", analyzer: "search_text" },
        description: { type: "text", analyzer: "search_text" },
        brand:       { type: "keyword" },
        category:    { type: "keyword" },
        price:       { type: "scaled_float", scaling_factor: 100 },
        in_stock:    { type: "boolean" }
      }
    }
  });
  await seedProducts(es, INDEX);

  const userQuery = "red runing shoes"; // intentional typo

  logSection("1. multi_match with field boosts and fuzziness");
  let res = await es.search({
    index: INDEX,
    size: 5,
    _source: ["title", "brand", "price"],
    query: {
      multi_match: {
        query: userQuery,
        fields: ["title^3", "brand^2", "description"],
        type: "best_fields",
        fuzziness: "AUTO",
        minimum_should_match: "66%"
      }
    }
  });
  logHits(res.hits.hits);

  logSection("2. add a phrase-bonus should clause -- watch ranking shift");
  res = await es.search({
    index: INDEX,
    size: 5,
    _source: ["title", "brand", "price"],
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: userQuery,
              fields: ["title^3", "brand^2", "description"],
              fuzziness: "AUTO",
              minimum_should_match: "66%"
            }
          }
        ],
        should: [
          {
            multi_match: {
              query: "red running shoes",
              fields: ["title^5"],
              type: "phrase"
            }
          }
        ]
      }
    }
  });
  logHits(res.hits.hits);

  logSection("3. cross_fields -- treat fields as one big field");
  res = await es.search({
    index: INDEX,
    size: 5,
    _source: ["title", "description"],
    query: {
      multi_match: {
        query: "waterproof rain hiking",
        fields: ["title", "description"],
        type: "cross_fields",
        operator: "and"
      }
    }
  });
  logHits(res.hits.hits);

  await dropIndex(es, INDEX);
  await es.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
