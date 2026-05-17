import { Client as ElasticClient } from "@elastic/elasticsearch";
import { Product as MongoProduct, ProductDoc } from "../models/ProductModel";
import { DatabaseConnections } from "../database/connections";

const PRODUCT_INDEX = "products";

export interface ElasticSyncResult {
  totalProductsInSource: number;
  totalProductsInIndex: number;
  indexedProducts: number;
  updatedProducts: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

export interface ElasticSyncOptions {
  batchSize?: number;
  dryRun?: boolean;
  forceReindex?: boolean;
}

export class ProductElasticSyncService {
  private static readonly DEFAULT_BATCH_SIZE = 100;

  private static readonly INDEX_SETTINGS = {
    settings: {
      number_of_shards: 1,
      number_of_replicas: 0,
      analysis: {
        analyzer: {
          product_analyzer: {
            type: "custom" as const,
            tokenizer: "standard",
            filter: ["lowercase", "trim", "product_stemmer"],
          },
          autocomplete_analyzer: {
            type: "custom" as const,
            tokenizer: "autocomplete_tokenizer",
            filter: ["lowercase"],
          },
        },
        tokenizer: {
          autocomplete_tokenizer: {
            type: "edge_ngram" as const,
            min_gram: 2,
            max_gram: 20,
            token_chars: ["letter" as const, "digit" as const],
          },
        },
        filter: {
          product_stemmer: {
            type: "stemmer" as const,
            language: "english",
          },
        },
      },
    },
    mappings: {
      properties: {
        title: {
          type: "text" as const,
          analyzer: "product_analyzer",
          fields: {
            autocomplete: {
              type: "text" as const,
              analyzer: "autocomplete_analyzer",
              search_analyzer: "standard",
            },
            keyword: {
              type: "keyword" as const,
            },
          },
        },
        description: {
          type: "text" as const,
          analyzer: "product_analyzer",
        },
        category: {
          type: "keyword" as const,
          fields: {
            text: {
              type: "text" as const,
              analyzer: "product_analyzer",
            },
          },
        },
        price: { type: "float" as const },
        originalPrice: { type: "float" as const },
        rating: { type: "float" as const },
        tags: { type: "keyword" as const },
        sellerId: { type: "keyword" as const },
        productId: { type: "keyword" as const },
        createdAt: { type: "date" as const },
        updatedAt: { type: "date" as const },
      },
    },
  };

  static async syncProducts(
    options: ElasticSyncOptions = {}
  ): Promise<ElasticSyncResult> {
    const startTime = Date.now();
    const result: ElasticSyncResult = {
      totalProductsInSource: 0,
      totalProductsInIndex: 0,
      indexedProducts: 0,
      updatedProducts: 0,
      errors: [],
      duration: 0,
      timestamp: new Date(),
    };

    try {
      const client = DatabaseConnections.getElasticClient();
      console.log("Starting product → Elasticsearch sync...");

      // Step 1: Ensure index exists with correct mappings
      await this.ensureIndex(client);

      // Step 2: Fetch all products from MongoDB
      const sourceProducts = await MongoProduct.find({});
      result.totalProductsInSource = sourceProducts.length;
      console.log(`Found ${sourceProducts.length} products in MongoDB`);

      if (sourceProducts.length === 0) {
        result.duration = Date.now() - startTime;
        return result;
      }

      // Step 3: Get current ES doc count
      const countResponse = await client.count({ index: PRODUCT_INDEX });
      result.totalProductsInIndex = countResponse.count;

      // Step 4: Bulk index products
      if (!options.dryRun) {
        const batchSize =
          options.batchSize || this.DEFAULT_BATCH_SIZE;
        const { indexed, updated, errors } = await this.bulkIndexProducts(
          client,
          sourceProducts,
          batchSize
        );
        result.indexedProducts = indexed;
        result.updatedProducts = updated;
        result.errors = errors;
      } else {
        console.log("Dry run mode - no products will be indexed");
      }

      result.duration = Date.now() - startTime;
      console.log(
        `Elasticsearch sync completed in ${result.duration}ms (indexed: ${result.indexedProducts}, updated: ${result.updatedProducts})`
      );

      return result;
    } catch (error: any) {
      result.errors.push(error.message);
      result.duration = Date.now() - startTime;
      console.error("Elasticsearch sync failed:", error.message);
      throw error;
    }
  }

  private static async ensureIndex(client: ElasticClient): Promise<void> {
    const exists = await client.indices.exists({ index: PRODUCT_INDEX });

    if (!exists) {
      console.log(`Creating index "${PRODUCT_INDEX}" with mappings...`);
      await client.indices.create({
        index: PRODUCT_INDEX,
        body: this.INDEX_SETTINGS,
      });
      console.log(`Index "${PRODUCT_INDEX}" created`);
    }
  }

  private static async bulkIndexProducts(
    client: ElasticClient,
    products: ProductDoc[],
    batchSize: number
  ): Promise<{ indexed: number; updated: number; errors: string[] }> {
    let indexed = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      const operations = batch.flatMap((product) => [
        {
          index: {
            _index: PRODUCT_INDEX,
            _id: product._id.toString(),
          },
        },
        {
          title: product.title,
          description: product.description || "",
          category: product.category || "other",
          price: product.price,
          originalPrice: product.originalPrice,
          rating: (product as any).rating || 0,
          tags: product.tags || [],
          sellerId: product.sellerId.toString(),
          productId: product._id.toString(),
          createdAt: (product as any).createdAt || new Date(),
          updatedAt: (product as any).updatedAt || new Date(),
        },
      ]);

      const bulkResponse = await client.bulk({
        refresh: false,
        operations,
      });

      if (bulkResponse.errors) {
        for (const item of bulkResponse.items) {
          const action = item.index;
          if (action?.error) {
            errors.push(
              `Failed to index ${action._id}: ${action.error.reason}`
            );
          }
        }
      }

      for (const item of bulkResponse.items) {
        if (item.index?.result === "created") indexed++;
        else if (item.index?.result === "updated") updated++;
      }

      console.log(
        `Indexed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`
      );
    }

    // Refresh to make documents searchable
    await client.indices.refresh({ index: PRODUCT_INDEX });

    return { indexed, updated, errors };
  }

  static async deleteProduct(productId: string): Promise<void> {
    try {
      const client = DatabaseConnections.getElasticClient();
      await client.delete({
        index: PRODUCT_INDEX,
        id: productId,
      });
      console.log(`Deleted product ${productId} from ES index`);
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        console.warn(`Product ${productId} not found in ES index`);
        return;
      }
      throw error;
    }
  }

  static async getStats(): Promise<{
    indexExists: boolean;
    documentCount: number;
    indexSize: string;
  }> {
    try {
      const client = DatabaseConnections.getElasticClient();
      const exists = await client.indices.exists({ index: PRODUCT_INDEX });

      if (!exists) {
        return { indexExists: false, documentCount: 0, indexSize: "0b" };
      }

      const stats = await client.indices.stats({ index: PRODUCT_INDEX });
      const indexStats = stats._all.primaries;

      return {
        indexExists: true,
        documentCount: indexStats?.docs?.count || 0,
        indexSize: `${indexStats?.store?.size_in_bytes || 0}b`,
      };
    } catch (error: any) {
      console.error("Error getting ES stats:", error.message);
      throw error;
    }
  }
}
