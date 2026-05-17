import mongoose from "mongoose";
import { DataSource } from "typeorm";
import { Client as ElasticClient } from "@elastic/elasticsearch";
import { Product as CartProduct } from "../entities/CartProduct";
import { Cart } from "../entities/Cart";

export class DatabaseConnections {
  private static mongoConnection: mongoose.Connection;
  private static orderMongoConnection: mongoose.Connection;
  private static postgresConnection: DataSource;
  private static elasticClient: ElasticClient;

  static async initialize() {
    await this.connectProductMongoDB();
    await this.connectOrderMongoDB();
    await this.connectPostgreSQL();
    await this.connectElasticsearch();
  }

  /**
   * Connect to Product Service MongoDB (source for product sync)
   */
  private static async connectProductMongoDB() {
    try {
      mongoose.set("strictQuery", false);
      await mongoose.connect(process.env.PRODUCT_SERVICE_MONGODB_URL!, {
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PASSWORD,
      });

      this.mongoConnection = mongoose.connection;
      console.log("ETL: Product Service MongoDB connected");
    } catch (error: any) {
      console.error("Product MongoDB connection error:", error.message);
      throw error;
    }
  }

  /**
   * Connect to Order Service MongoDB (target for cart sync)
   */
  private static async connectOrderMongoDB() {
    try {
      // Create a separate connection for Order Service
      const orderMongoUrl = process.env.ORDER_SERVICE_MONGODB_URL;
      if (!orderMongoUrl) {
        console.warn(
          "ORDER_SERVICE_MONGODB_URL not set, using default connection for order service",
        );
        this.orderMongoConnection = this.mongoConnection;
        return;
      }

      const orderConnection = await mongoose
        .createConnection(orderMongoUrl, {
          user: process.env.MONGO_USER,
          pass: process.env.MONGO_PASSWORD,
        })
        .asPromise();

      this.orderMongoConnection = orderConnection;
      console.log("ETL: Order Service MongoDB connected");
    } catch (error: any) {
      console.error("Order MongoDB connection error:", error.message);
      // Fallback to main connection if order-specific connection fails
      this.orderMongoConnection = this.mongoConnection;
      console.warn("ETL: Using Product MongoDB for Order Service (fallback)");
    }
  }

  /**
   * Connect to Cart Service PostgreSQL (source for cart sync)
   */
  private static async connectPostgreSQL() {
    try {
      // ETL writes (INSERT) to cart DB, so it needs the primary (write) URL
      const pgUrl = process.env.CART_DB_WRITE_URL || process.env.CART_DB_URL;
      this.postgresConnection = new DataSource({
        type: "postgres",
        port: 5432,
        url: pgUrl,
        entities: [CartProduct, Cart],
        synchronize: false, // Don't auto-sync schema in ETL service
        logging: process.env.NODE_ENV === "development",
      });

      await this.postgresConnection.initialize();
      console.log("ETL: Cart Service PostgreSQL connected");
    } catch (error: any) {
      console.error("PostgreSQL connection error:", error.message);
      throw error;
    }
  }

  static getMongoConnection() {
    if (!this.mongoConnection) {
      throw new Error("MongoDB connection not initialized");
    }
    return this.mongoConnection;
  }

  static getOrderMongoConnection() {
    if (!this.orderMongoConnection) {
      throw new Error("Order MongoDB connection not initialized");
    }
    return this.orderMongoConnection;
  }

  static getPostgresConnection() {
    if (!this.postgresConnection) {
      throw new Error("PostgreSQL connection not initialized");
    }
    return this.postgresConnection;
  }

  static getElasticClient() {
    if (!this.elasticClient) {
      throw new Error("Elasticsearch connection not initialized");
    }
    return this.elasticClient;
  }

  static async close() {
    try {
      if (this.mongoConnection) {
        await mongoose.connection.close();
        console.log("Product MongoDB connection closed");
      }

      if (this.orderMongoConnection && this.orderMongoConnection !== this.mongoConnection) {
        await this.orderMongoConnection.close();
        console.log("Order MongoDB connection closed");
      }

      if (this.postgresConnection && this.postgresConnection.isInitialized) {
        await this.postgresConnection.destroy();
        console.log("PostgreSQL connection closed");
      }

      if (this.elasticClient) {
        await this.elasticClient.close();
        console.log("Elasticsearch connection closed");
      }
    } catch (error: any) {
      console.error("Error closing database connections:", error.message);
    }
  }

  /**
   * Connect to Elasticsearch (target for product search sync)
   */
  private static async connectElasticsearch() {
    try {
      const esUrl = process.env.ELASTICSEARCH_URL;
      if (!esUrl) {
        console.warn("ELASTICSEARCH_URL not set, skipping Elasticsearch connection");
        return;
      }

      this.elasticClient = new ElasticClient({ node: esUrl });

      // Verify connection
      const info = await this.elasticClient.info();
      console.log(`ETL: Elasticsearch connected (cluster: ${info.cluster_name})`);
    } catch (error: any) {
      console.error("Elasticsearch connection error:", error.message);
      // Non-fatal: ETL can still run other pipelines without ES
      console.warn("ETL: Elasticsearch sync will be unavailable");
    }
  }

  static async testConnections() {
    const status = { productMongodb: false, orderMongodb: false, postgresql: false, elasticsearch: false };

    try {
      // Test Product MongoDB
      await mongoose.connection.db.admin().ping();
      status.productMongodb = true;
    } catch (e: any) {
      console.error("Product MongoDB test failed:", e.message);
    }

    try {
      // Test Order MongoDB
      if (this.orderMongoConnection) {
        await this.orderMongoConnection.db.admin().ping();
        status.orderMongodb = true;
      }
    } catch (e: any) {
      console.error("Order MongoDB test failed:", e.message);
    }

    try {
      // Test PostgreSQL
      await this.postgresConnection.query("SELECT 1");
      status.postgresql = true;
    } catch (e: any) {
      console.error("PostgreSQL test failed:", e.message);
    }

    try {
      // Test Elasticsearch
      if (this.elasticClient) {
        await this.elasticClient.ping();
        status.elasticsearch = true;
      }
    } catch (e: any) {
      console.error("Elasticsearch test failed:", e.message);
    }

    return status;
  }
}
