import { dropIndex, logSection, makeClient } from "../src/client";
import { loadProducts } from "../src/seed";

const NGRAM = "ex05_ac_ngram";
const SAYT  = "ex05_ac_sayt";
const COMP  = "ex05_ac_completion";

const PREFIX = "red ru";

async function main(): Promise<void> {
  const es = makeClient();
  const products = loadProducts();

  await Promise.all([dropIndex(es, NGRAM), dropIndex(es, SAYT), dropIndex(es, COMP)]);

  // ---------- 1. Edge n-grams ----------
  await es.indices.create({
    index: NGRAM,
    settings: {
      analysis: {
        analyzer: {
          edge_ngram_index: {
            tokenizer: "standard",
            filter: ["lowercase", "edge_ngram_filter"]
          },
          edge_ngram_search: {
            tokenizer: "standard",
            filter: ["lowercase"]
          }
        },
        filter: {
          edge_ngram_filter: { type: "edge_ngram", min_gram: 2, max_gram: 15 }
        }
      }
    },
    mappings: {
      properties: {
        title: {
          type: "text",
          analyzer: "edge_ngram_index",
          search_analyzer: "edge_ngram_search"
        }
      }
    }
  });
  await es.helpers.bulk({
    datasource: products,
    onDocument: (doc) => ({ index: { _index: NGRAM, _id: doc.id } })
  });
  await es.indices.refresh({ index: NGRAM });

  // ---------- 2. search_as_you_type ----------
  await es.indices.create({
    index: SAYT,
    mappings: {
      properties: { title: { type: "search_as_you_type" } }
    }
  });
  await es.helpers.bulk({
    datasource: products,
    onDocument: (doc) => ({ index: { _index: SAYT, _id: doc.id } })
  });
  await es.indices.refresh({ index: SAYT });

  // ---------- 3. completion suggester ----------
  await es.indices.create({
    index: COMP,
    mappings: {
      properties: {
        title:   { type: "text" },
        suggest: { type: "completion" }
      }
    }
  });
  await es.helpers.bulk({
    datasource: products,
    onDocument: (doc) => ({ index: { _index: COMP, _id: doc.id } }),
    onDrop:     () => { /* no-op */ }
  });
  // re-index with explicit suggest input (helpers.bulk above only ships title)
  for (const p of products) {
    await es.index({
      index: COMP,
      id:    p.id,
      document: {
        title:   p.title,
        suggest: { input: [p.title, p.brand], weight: p.popularity }
      }
    });
  }
  await es.indices.refresh({ index: COMP });

  // ---------- queries ----------
  logSection(`Prefix: "${PREFIX}"`);

  const t1 = Date.now();
  const r1 = await es.search({
    index: NGRAM,
    size: 5,
    _source: ["title"],
    query: { match: { title: { query: PREFIX, operator: "and" } } }
  });
  const ms1 = Date.now() - t1;
  console.log(`\nedge n-grams (${ms1}ms):`);
  for (const h of r1.hits.hits) console.log("  ", (h._source as { title: string }).title);

  const t2 = Date.now();
  const r2 = await es.search({
    index: SAYT,
    size: 5,
    _source: ["title"],
    query: {
      multi_match: {
        query: PREFIX,
        type: "bool_prefix",
        fields: ["title", "title._2gram", "title._3gram"]
      }
    }
  });
  const ms2 = Date.now() - t2;
  console.log(`\nsearch_as_you_type (${ms2}ms):`);
  for (const h of r2.hits.hits) console.log("  ", (h._source as { title: string }).title);

  const t3 = Date.now();
  const r3 = await es.search({
    index: COMP,
    suggest: {
      product_suggest: {
        prefix: PREFIX,
        completion: { field: "suggest", size: 5, fuzzy: { fuzziness: 1 } }
      }
    }
  });
  const ms3 = Date.now() - t3;
  console.log(`\ncompletion suggester (${ms3}ms):`);
  const suggestList = r3.suggest?.product_suggest?.[0]?.options;
  const options = Array.isArray(suggestList) ? suggestList : [];
  for (const o of options) console.log("  ", (o as { text: string }).text);

  // ---------- index sizes ----------
  const stats = await es.indices.stats({ index: `${NGRAM},${SAYT},${COMP}` });
  console.log("\nindex sizes (bytes):");
  for (const [name, body] of Object.entries(stats.indices ?? {})) {
    const size = (body as { primaries?: { store?: { size_in_bytes?: number } } })
      .primaries?.store?.size_in_bytes ?? 0;
    console.log(`  ${name.padEnd(28)} ${size.toLocaleString()}`);
  }

  await Promise.all([dropIndex(es, NGRAM), dropIndex(es, SAYT), dropIndex(es, COMP)]);
  await es.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
