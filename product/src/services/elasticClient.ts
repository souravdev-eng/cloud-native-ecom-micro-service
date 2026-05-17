import { Client } from "@elastic/elasticsearch";

let esClient: Client | null = null;

export const PRODUCT_INDEX = "products";

export const connectElasticsearch = async (): Promise<void> => {
  const esUrl = process.env.ELASTICSEARCH_URL;

  if (!esUrl) {
    console.warn("ELASTICSEARCH_URL not set, Elasticsearch search disabled");
    return;
  }

  try {
    esClient = new Client({ node: esUrl });
    const info = await esClient.info();
    console.log(`Product Service: Elasticsearch connected (cluster: ${info.cluster_name})`);
  } catch (error: any) {
    console.error("Elasticsearch connection failed:", error.message);
    console.warn("Product Service: Full-text search will fall back to MongoDB");
    esClient = null;
  }
};

export const getElasticClient = (): Client | null => {
  return esClient;
};

export const isElasticAvailable = async (): Promise<boolean> => {
  if (esClient !== null) return true;

  // Lazy reconnect: ES may have started after the product service
  const esUrl = process.env.ELASTICSEARCH_URL;
  if (!esUrl) return false;

  try {
    esClient = new Client({ node: esUrl });
    await esClient.ping();
    console.log("Product Service: Elasticsearch reconnected (lazy)");
    return true;
  } catch {
    esClient = null;
    return false;
  }
};
