import { ProductSyncService } from '../../etl/productSync';
import { Product as MongoProduct } from '../../models/ProductModel';
import { Product as CartProduct } from '../../entities/CartProduct';
import { DatabaseConnections } from '../../database/connections';

// Mock the DatabaseConnections
jest.mock('../../database/connections');
const mockDatabaseConnections = DatabaseConnections as jest.Mocked<typeof DatabaseConnections>;

describe('ProductSyncService', () => {
  beforeEach(() => {
    // Mock the database connections
    mockDatabaseConnections.getPostgresConnection.mockReturnValue(global.__POSTGRES__);
  });

  describe('syncProducts', () => {
    it('should sync missing products from MongoDB to PostgreSQL', async () => {
      // Create test products in MongoDB
      const mongoProduct1 = MongoProduct.build({
        title: 'Test Product 1',
        price: 100,
        image: 'test-image-1.jpg',
        sellerId: '507f1f77bcf86cd799439011',
        description: 'Test description 1',
        category: 'other' as any,
        quantity: 10,
      });
      await mongoProduct1.save();

      const mongoProduct2 = MongoProduct.build({
        title: 'Test Product 2',
        price: 200,
        image: 'test-image-2.jpg',
        sellerId: '507f1f77bcf86cd799439012',
        description: 'Test description 2',
        category: 'phone' as any,
        quantity: 5,
      });
      await mongoProduct2.save();

      // Create only one product in PostgreSQL (simulating missing product)
      const cartProduct = new CartProduct();
      cartProduct.id = mongoProduct1.id;
      cartProduct.title = mongoProduct1.title;
      cartProduct.price = mongoProduct1.price;
      cartProduct.image = mongoProduct1.image;
      cartProduct.sellerId = mongoProduct1.sellerId.toString();
      cartProduct.quantity = mongoProduct1.quantity!;
      await global.__POSTGRES__.getRepository(CartProduct).save(cartProduct);

      // Run sync
      const result = await ProductSyncService.syncProducts({ batchSize: 10 });

      // Verify results
      expect(result.totalProductsInSource).toBe(2);
      expect(result.totalProductsInTarget).toBe(1);
      expect(result.missingProducts).toBe(1);
      expect(result.syncedProducts).toBe(1);
      expect(result.errors).toHaveLength(0);

      // Verify the missing product was synced
      const allCartProducts = await global.__POSTGRES__.getRepository(CartProduct).find();
      expect(allCartProducts).toHaveLength(2);
      
      const syncedProduct = allCartProducts.find(p => p.id === mongoProduct2.id);
      expect(syncedProduct).toBeDefined();
      expect(syncedProduct!.title).toBe(mongoProduct2.title);
      expect(syncedProduct!.price).toBe(mongoProduct2.price);
    });

    it('should handle dry run mode', async () => {
      // Create test product in MongoDB
      const mongoProduct = MongoProduct.build({
        title: 'Test Product',
        price: 100,
        image: 'test-image.jpg',
        sellerId: '507f1f77bcf86cd799439011',
        description: 'Test description',
        category: 'other' as any,
        quantity: 10,
      });
      await mongoProduct.save();

      // Run dry run sync
      const result = await ProductSyncService.syncProducts({ 
        dryRun: true,
        batchSize: 10 
      });

      // Verify results
      expect(result.totalProductsInSource).toBe(1);
      expect(result.totalProductsInTarget).toBe(0);
      expect(result.missingProducts).toBe(1);
      expect(result.syncedProducts).toBe(0); // Should be 0 in dry run
      expect(result.errors).toHaveLength(0);

      // Verify no products were actually synced
      const allCartProducts = await global.__POSTGRES__.getRepository(CartProduct).find();
      expect(allCartProducts).toHaveLength(0);
    });

    it('should handle empty source database', async () => {
      // Run sync with no products in MongoDB
      const result = await ProductSyncService.syncProducts({ batchSize: 10 });

      // Verify results
      expect(result.totalProductsInSource).toBe(0);
      expect(result.totalProductsInTarget).toBe(0);
      expect(result.missingProducts).toBe(0);
      expect(result.syncedProducts).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle databases already in sync', async () => {
      // Create test product in MongoDB
      const mongoProduct = MongoProduct.build({
        title: 'Test Product',
        price: 100,
        image: 'test-image.jpg',
        sellerId: '507f1f77bcf86cd799439011',
        description: 'Test description',
        category: 'other' as any,
        quantity: 10,
      });
      await mongoProduct.save();

      // Create same product in PostgreSQL
      const cartProduct = new CartProduct();
      cartProduct.id = mongoProduct.id;
      cartProduct.title = mongoProduct.title;
      cartProduct.price = mongoProduct.price;
      cartProduct.image = mongoProduct.image;
      cartProduct.sellerId = mongoProduct.sellerId.toString();
      cartProduct.quantity = mongoProduct.quantity!;
      await global.__POSTGRES__.getRepository(CartProduct).save(cartProduct);

      // Run sync
      const result = await ProductSyncService.syncProducts({ batchSize: 10 });

      // Verify results
      expect(result.totalProductsInSource).toBe(1);
      expect(result.totalProductsInTarget).toBe(1);
      expect(result.missingProducts).toBe(0);
      expect(result.syncedProducts).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateSync', () => {
    it('should validate successful sync', async () => {
      // Create test product in both databases
      const mongoProduct = MongoProduct.build({
        title: 'Test Product',
        price: 100,
        image: 'test-image.jpg',
        sellerId: '507f1f77bcf86cd799439011',
        description: 'Test description',
        category: 'other' as any,
        quantity: 10,
      });
      await mongoProduct.save();

      const cartProduct = new CartProduct();
      cartProduct.id = mongoProduct.id;
      cartProduct.title = mongoProduct.title;
      cartProduct.price = mongoProduct.price;
      cartProduct.image = mongoProduct.image;
      cartProduct.sellerId = mongoProduct.sellerId.toString();
      cartProduct.quantity = mongoProduct.quantity!;
      await global.__POSTGRES__.getRepository(CartProduct).save(cartProduct);

      // Validate sync
      const validation = await ProductSyncService.validateSync();

      // Verify validation
      expect(validation.isValid).toBe(true);
      expect(validation.details.sourceCount).toBe(1);
      expect(validation.details.targetCount).toBe(1);
      expect(validation.details.missingInTarget).toBe(0);
      expect(validation.details.extraInTarget).toBe(0);
    });

    it('should detect missing products in target', async () => {
      // Create test product only in MongoDB
      const mongoProduct = MongoProduct.build({
        title: 'Test Product',
        price: 100,
        image: 'test-image.jpg',
        sellerId: '507f1f77bcf86cd799439011',
        description: 'Test description',
        category: 'other' as any,
        quantity: 10,
      });
      await mongoProduct.save();

      // Validate sync
      const validation = await ProductSyncService.validateSync();

      // Verify validation
      expect(validation.isValid).toBe(false);
      expect(validation.details.sourceCount).toBe(1);
      expect(validation.details.targetCount).toBe(0);
      expect(validation.details.missingInTarget).toBe(1);
      expect(validation.details.missingProductIds).toContain(mongoProduct.id);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      // Create test products
      const mongoProduct = MongoProduct.build({
        title: 'Test Product',
        price: 100,
        image: 'test-image.jpg',
        sellerId: '507f1f77bcf86cd799439011',
        description: 'Test description',
        category: 'other' as any,
        quantity: 10,
      });
      await mongoProduct.save();

      const cartProduct = new CartProduct();
      cartProduct.id = 'different-id';
      cartProduct.title = 'Different Product';
      cartProduct.price = 200;
      cartProduct.image = 'different-image.jpg';
      cartProduct.sellerId = '507f1f77bcf86cd799439012';
      cartProduct.quantity = 5;
      await global.__POSTGRES__.getRepository(CartProduct).save(cartProduct);

      // Get stats
      const stats = await ProductSyncService.getStats();

      // Verify stats
      expect(stats.sourceCount).toBe(1);
      expect(stats.targetCount).toBe(1);
      expect(stats.lastSyncTime).toBeDefined();
    });
  });
});
