import { Router, Request, Response } from "express";
import { requireAuth, restrictTo, BadRequestError } from "@ecom-micro/common";
import { ProductSyncService, SyncOptions } from "../etl/productSync";
import { CartOrderSyncService, CartSyncOptions } from "../etl/cartOrderSync";
import { ProductElasticSyncService, ElasticSyncOptions } from "../etl/productElasticSync";

const router = Router();

/**
 * POST /api/etl/sync
 * Run ALL ETL pipelines (Product + Cart sync)
 */
router.post(
  "/api/etl/sync",
  requireAuth,
  // restrictTo('admin'),
  async (req: Request, res: Response) => {
    try {
      const { dryRun = false, batchSize = 100, pipelines } = req.body;

      if (batchSize < 1 || batchSize > 1000) {
        throw new BadRequestError("Batch size must be between 1 and 1000");
      }

      const options: SyncOptions & CartSyncOptions = {
        dryRun: Boolean(dryRun),
        batchSize: Number(batchSize),
      };

      console.log(`Full ETL sync triggered by user ${req.user?.id}`, options);

      // Determine which pipelines to run
      const runProduct = !pipelines || pipelines.includes("product");
      const runCart = !pipelines || pipelines.includes("cart");

      const results: any = {
        timestamp: new Date(),
        dryRun: options.dryRun,
      };

      // Run Product sync (Product Service → Cart Service)
      if (runProduct) {
        try {
          results.productSync = await ProductSyncService.syncProducts(options);
        } catch (error: any) {
          results.productSync = { error: error.message };
        }
      }

      // Run Cart sync (Cart Service → Order Service)
      if (runCart) {
        try {
          results.cartSync = await CartOrderSyncService.syncCarts(options);
        } catch (error: any) {
          results.cartSync = { error: error.message };
        }
      }

      const hasErrors = results.productSync?.error || results.cartSync?.error;

      res.status(hasErrors ? 207 : 200).json({
        success: !hasErrors,
        message: dryRun
          ? "Dry run completed"
          : hasErrors
            ? "Sync completed with some errors"
            : "All ETL pipelines synced successfully",
        results,
      });
    } catch (error: any) {
      console.error("ETL sync failed:", error.message);
      res.status(500).json({
        success: false,
        message: "ETL sync failed",
        error: error.message,
      });
    }
  },
);

/**
 * GET /api/etl/status
 * Get status of ALL ETL pipelines
 */
router.get(
  "/api/etl/status",
  requireAuth,
  //   restrictTo("admin"),
  async (req: Request, res: Response) => {
    try {
      const [productStats, productValidation, cartStats, cartValidation] = await Promise.all([
        ProductSyncService.getStats(),
        ProductSyncService.validateSync(),
        CartOrderSyncService.getStats().catch(() => null),
        CartOrderSyncService.validateSync().catch(() => null),
      ]);

      res.status(200).json({
        success: true,
        productSync: {
          stats: productStats,
          validation: productValidation,
        },
        cartSync: {
          stats: cartStats,
          validation: cartValidation,
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Failed to get sync status:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get sync status",
        error: error.message,
      });
    }
  },
);

/**
 * GET /api/etl/validate
 * Validate ALL ETL pipelines
 */
router.get(
  "/api/etl/validate",
  requireAuth,
  restrictTo("admin"),
  async (req: Request, res: Response) => {
    try {
      const [productValidation, cartValidation] = await Promise.all([
        ProductSyncService.validateSync(),
        CartOrderSyncService.validateSync().catch(() => ({
          isValid: false,
          details: { error: "Cart sync not available" },
        })),
      ]);

      const allValid = productValidation.isValid && cartValidation.isValid;

      res.status(200).json({
        success: true,
        isValid: allValid,
        productSync: productValidation,
        cartSync: cartValidation,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Sync validation failed:", error.message);
      res.status(500).json({
        success: false,
        message: "Sync validation failed",
        error: error.message,
      });
    }
  },
);

/**
 * GET /api/etl/stats
 * Get statistics for ALL ETL pipelines
 */
router.get(
  "/api/etl/stats",
  requireAuth,
  restrictTo("admin"),
  async (req: Request, res: Response) => {
    try {
      const [productStats, cartStats] = await Promise.all([
        ProductSyncService.getStats(),
        CartOrderSyncService.getStats().catch(() => null),
      ]);

      res.status(200).json({
        success: true,
        productSync: productStats,
        cartSync: cartStats,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Failed to get sync stats:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get sync stats",
        error: error.message,
      });
    }
  },
);

/**
 * POST /api/etl/sync/elasticsearch
 * Sync products from MongoDB → Elasticsearch
 */
router.post(
  "/api/etl/sync/elasticsearch",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { dryRun = false, batchSize = 100 } = req.body;

      if (batchSize < 1 || batchSize > 1000) {
        throw new BadRequestError("Batch size must be between 1 and 1000");
      }

      const options: ElasticSyncOptions = {
        dryRun: Boolean(dryRun),
        batchSize: Number(batchSize),
      };

      console.log(`ES sync triggered by user ${req.user?.id}`, options);

      const result = await ProductElasticSyncService.syncProducts(options);

      res.status(200).json({
        success: true,
        message: dryRun
          ? "Dry run completed"
          : "Elasticsearch sync completed",
        result,
      });
    } catch (error: any) {
      console.error("ES sync failed:", error.message);
      res.status(500).json({
        success: false,
        message: "Elasticsearch sync failed",
        error: error.message,
      });
    }
  },
);

/**
 * GET /api/etl/sync/elasticsearch/stats
 * Get Elasticsearch index statistics
 */
router.get(
  "/api/etl/sync/elasticsearch/stats",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const stats = await ProductElasticSyncService.getStats();

      res.status(200).json({
        success: true,
        stats,
        timestamp: new Date(),
      });
    } catch (error: any) {
      console.error("Failed to get ES stats:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get Elasticsearch stats",
        error: error.message,
      });
    }
  },
);

export { router as syncRoutes };
