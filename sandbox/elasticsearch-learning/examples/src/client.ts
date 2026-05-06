import { Client } from "@elastic/elasticsearch";

/**
 * Shared Elasticsearch client for sandbox examples.
 *
 * Reads ELASTIC_URL from env, falling back to the local docker-compose
 * (`docker compose up -d` from the parent directory).
 *
 * Examples that need auth or TLS would add { auth: ..., tls: ... } here;
 * the sandbox compose runs with security disabled to keep the focus on
 * search semantics.
 */
export function makeClient(): Client {
  const node = process.env.ELASTIC_URL ?? "http://localhost:9200";
  return new Client({
    node,
    requestTimeout: 5_000,
    maxRetries: 3
  });
}

/**
 * Best-effort cleanup helper used at the start/end of each example.
 * `ignore: 404` so it does not throw when the index does not exist yet.
 */
export async function dropIndex(client: Client, index: string): Promise<void> {
  await client.indices.delete({ index }, { ignore: [404] });
}

export function logSection(title: string): void {
  console.log("\n" + "=".repeat(70));
  console.log(title);
  console.log("=".repeat(70));
}

export function logHits(
  hits: ReadonlyArray<{ _id?: string; _score?: number | null; _source?: unknown }>
): void {
  for (const h of hits) {
    const src = h._source as Record<string, unknown> | undefined;
    const title = src && typeof src["title"] === "string" ? src["title"] : "?";
    const score = h._score ?? 0;
    console.log(`  [${score.toFixed(3)}] ${h._id}  ${title}`);
  }
}
