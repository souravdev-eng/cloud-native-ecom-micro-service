import { dropIndex, logSection, makeClient } from "../src/client";

const INDEX = "ex02_products";

async function main(): Promise<void> {
  const es = makeClient();
  await dropIndex(es, INDEX);

  logSection("1. Create index with custom analyzer");
  await es.indices.create({
    index: INDEX,
    settings: {
      analysis: {
        analyzer: {
          search_text: {
            type: "custom",
            tokenizer: "standard",
            filter: ["lowercase", "asciifolding", "english_stop"]
          }
        },
        filter: {
          english_stop: { type: "stop", stopwords: "_english_" }
        }
      }
    },
    mappings: {
      properties: {
        title: { type: "text", analyzer: "search_text" },
        brand: { type: "keyword" }
      }
    }
  });

  logSection("2. _analyze: see what tokens come out");
  const analyzed = await es.indices.analyze({
    index: INDEX,
    analyzer: "search_text",
    text: "Café Running Shoes! THE Best"
  });
  console.log("  tokens:", analyzed.tokens?.map((t) => t.token));

  logSection("3. Index a doc and search");
  await es.index({
    index: INDEX,
    id: "p_1",
    document: { title: "Café Running Shoes", brand: "Acme" }
  });
  await es.indices.refresh({ index: INDEX });

  logSection("4. match on title -- analyzed both sides, finds it");
  let res = await es.search({ index: INDEX, query: { match: { title: "cafe" } } });
  console.log(`  match 'cafe' -> ${res.hits.hits.length} hit(s)`);

  logSection("5. term on title -- not analyzed, lowercase tokens stored");
  res = await es.search({ index: INDEX, query: { term: { title: "Café" } } });
  console.log(`  term 'Café' on title -> ${res.hits.hits.length} hit(s) (expected 0; raw input not lowercased)`);
  res = await es.search({ index: INDEX, query: { term: { title: "cafe" } } });
  console.log(`  term 'cafe' on title -> ${res.hits.hits.length} hit(s) (matches stored token)`);

  logSection("6. term on brand (keyword) -- exact match");
  res = await es.search({ index: INDEX, query: { term: { brand: "Acme" } } });
  console.log(`  term 'Acme' on brand -> ${res.hits.hits.length} hit(s)`);
  res = await es.search({ index: INDEX, query: { term: { brand: "acme" } } });
  console.log(`  term 'acme' on brand -> ${res.hits.hits.length} hit(s) (case-sensitive on keyword)`);

  await dropIndex(es, INDEX);
  await es.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
