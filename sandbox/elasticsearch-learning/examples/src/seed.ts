import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Client } from "@elastic/elasticsearch";

export interface Product {
  id: string;
  title: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  tags: string[];
  popularity: number;
  in_stock: boolean;
  createdAt: string;
}

/** Loads the shared product fixture (~30 docs). */
export function loadProducts(): Product[] {
  const path = join(__dirname, "seed", "products.json");
  return JSON.parse(readFileSync(path, "utf8")) as Product[];
}

/**
 * Bulk-indexes the products into the given index using the helpers.bulk
 * stream. Refreshes at the end so the next search call is deterministic.
 */
export async function seedProducts(
  client: Client,
  index: string,
  products: Product[] = loadProducts()
): Promise<void> {
  await client.helpers.bulk({
    datasource: products,
    onDocument: (doc) => ({ index: { _index: index, _id: doc.id } }),
    flushBytes: 1_000_000,
    concurrency: 2
  });
  await client.indices.refresh({ index });
}
