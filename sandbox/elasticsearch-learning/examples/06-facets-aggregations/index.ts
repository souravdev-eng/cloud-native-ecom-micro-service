import { dropIndex, logHits, logSection, makeClient } from "../src/client";
import { seedProducts } from "../src/seed";

const INDEX = "ex06_products";

interface TermsBucket { key: string; doc_count: number }
interface RangeBucket { key: string; doc_count: number; from?: number; to?: number }

function showBuckets(label: string, buckets: ReadonlyArray<TermsBucket | RangeBucket>): void {
  console.log(`  ${label}`);
  for (const b of buckets) {
    console.log(`    ${b.key.padEnd(20)}  ${b.doc_count}`);
  }
}

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
        in_stock:    { type: "boolean" }
      }
    }
  });
  await seedProducts(es, INDEX);

  logSection("1. Search 'shoes' + facets, no extra filter");
  let res = await es.search({
    index: INDEX,
    size: 5,
    _source: ["title", "brand", "price"],
    query: {
      bool: {
        must:   [{ multi_match: { query: "shoes", fields: ["title^3", "description"] } }]
      }
    },
    aggs: {
      by_brand: { terms: { field: "brand", size: 10 } },
      price_ranges: {
        range: {
          field: "price",
          ranges: [
            { to: 50,  key: "0-50"     },
            { from: 50, to: 100, key: "50-100" },
            { from: 100, to: 200, key: "100-200" },
            { from: 200, key: "200+"    }
          ]
        }
      }
    }
  });
  console.log(`  hits (top 5):`);
  logHits(res.hits.hits);
  showBuckets("brands:", (res.aggregations?.by_brand as { buckets: TermsBucket[] }).buckets);
  showBuckets("price:", (res.aggregations?.price_ranges as { buckets: RangeBucket[] }).buckets);

  logSection("2. User picks brand = Acme via post_filter -- facet stays full");
  res = await es.search({
    index: INDEX,
    size: 5,
    _source: ["title", "brand", "price"],
    query: {
      bool: {
        must:   [{ multi_match: { query: "shoes", fields: ["title^3", "description"] } }]
      }
    },
    post_filter: { term: { brand: "Acme" } },
    aggs: {
      by_brand: { terms: { field: "brand", size: 10 } },
      price_ranges: {
        range: {
          field: "price",
          ranges: [
            { to: 50,  key: "0-50"     },
            { from: 50, to: 100, key: "50-100" },
            { from: 100, to: 200, key: "100-200" },
            { from: 200, key: "200+"    }
          ]
        }
      }
    }
  });
  console.log(`  hits (top 5, narrowed to Acme):`);
  logHits(res.hits.hits);
  showBuckets("brands (still full!):",
    (res.aggregations?.by_brand as { buckets: TermsBucket[] }).buckets);

  await dropIndex(es, INDEX);
  await es.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
