import { dropIndex, logHits, logSection, makeClient } from "../src/client";
import { seedProducts } from "../src/seed";

const ALIAS = "ex08_products";
const V1    = "ex08_products_v1";
const V2    = "ex08_products_v2";

async function searchViaAlias(es: ReturnType<typeof makeClient>, query: string): Promise<void> {
  const res = await es.search({
    index: ALIAS,
    size: 5,
    _source: ["title"],
    query: { match: { title: query } }
  });
  logHits(res.hits.hits);
}

async function main(): Promise<void> {
  const es = makeClient();
  await Promise.all([dropIndex(es, V1), dropIndex(es, V2)]);

  logSection("1. Create v1 with the standard analyzer and seed it");
  await es.indices.create({
    index: V1,
    mappings: { properties: { title: { type: "text" }, brand: { type: "keyword" } } }
  });
  await seedProducts(es, V1);

  logSection("2. Point alias 'ex08_products' at v1");
  await es.indices.putAlias({ index: V1, name: ALIAS });

  logSection("3. Search via alias for 'runs' (no stemming yet)");
  await searchViaAlias(es, "runs");

  logSection("4. Create v2 with English analyzer (stemming + stop words)");
  await es.indices.create({
    index: V2,
    settings: {
      analysis: {
        analyzer: {
          english_text: {
            type: "custom",
            tokenizer: "standard",
            filter: ["lowercase", "english_stop", "english_stemmer"]
          }
        },
        filter: {
          english_stop:    { type: "stop",    stopwords: "_english_" },
          english_stemmer: { type: "stemmer", language: "english" }
        }
      }
    },
    mappings: {
      properties: {
        title: { type: "text", analyzer: "english_text" },
        brand: { type: "keyword" }
      }
    }
  });

  logSection("5. _reindex v1 -> v2");
  const reindex = await es.reindex({
    source: { index: V1 },
    dest:   { index: V2 },
    refresh: true
  });
  console.log(`  copied ${reindex.total} docs`);

  logSection("6. Atomically swap alias v1 -> v2");
  await es.indices.updateAliases({
    actions: [
      { remove: { index: V1, alias: ALIAS } },
      { add:    { index: V2, alias: ALIAS } }
    ]
  });

  logSection("7. Search via alias for 'runs' (English stemmer matches 'running')");
  await searchViaAlias(es, "runs");

  logSection("8. Cleanup");
  await Promise.all([dropIndex(es, V1), dropIndex(es, V2)]);
  await es.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
