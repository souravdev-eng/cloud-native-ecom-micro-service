import request from 'supertest';
import app from '../../app';
import { ProductSyncService } from '../../etl/productSync';

// Mock the ProductSyncService
jest.mock('../../etl/productSync');
const mockProductSyncService = ProductSyncService as jest.Mocked<typeof ProductSyncService>;

// Mock the DatabaseConnections
jest.mock('../../database/connections');

describe('Sync Routes', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'admin@test.com',
    role: 'admin',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/etl/sync', () => {
    it('should trigger sync successfully for admin user', async () => {
      const mockResult = {
        totalProductsInSource: 10,
        totalProductsInTarget: 8,
        missingProducts: 2,
        syncedProducts: 2,
        errors: [],
        duration: 1000,
        timestamp: new Date(),
      };

      mockProductSyncService.syncProducts.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/etl/sync')
        .set('Cookie', [`session=${Buffer.from(JSON.stringify({ jwt: 'valid-jwt' })).toString('base64')}`])
        .send({ dryRun: false, batchSize: 100 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sync completed successfully');
      expect(response.body.result).toEqual(mockResult);
      expect(mockProductSyncService.syncProducts).toHaveBeenCalledWith({
        dryRun: false,
        batchSize: 100,
      });
    });

    it('should handle dry run mode', async () => {
      const mockResult = {
        totalProductsInSource: 10,
        totalProductsInTarget: 8,
        missingProducts: 2,
        syncedProducts: 0, // No products synced in dry run
        errors: [],
        duration: 500,
        timestamp: new Date(),
      };

      mockProductSyncService.syncProducts.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/etl/sync')
        .set('Cookie', [`session=${Buffer.from(JSON.stringify({ jwt: 'valid-jwt' })).toString('base64')}`])
        .send({ dryRun: true, batchSize: 50 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Dry run completed successfully');
      expect(mockProductSyncService.syncProducts).toHaveBeenCalledWith({
        dryRun: true,
        batchSize: 50,
      });
    });

    it('should reject invalid batch size', async () => {
      const response = await request(app)
        .post('/api/etl/sync')
        .set('Cookie', [`session=${Buffer.from(JSON.stringify({ jwt: 'valid-jwt' })).toString('base64')}`])
        .send({ batchSize: 2000 }); // Invalid batch size

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Batch size must be between 1 and 1000');
    });

    it('should handle sync errors', async () => {
      mockProductSyncService.syncProducts.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/etl/sync')
        .set('Cookie', [`session=${Buffer.from(JSON.stringify({ jwt: 'valid-jwt' })).toString('base64')}`])
        .send({ dryRun: false });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Sync failed');
      expect(response.body.error).toBe('Database connection failed');
    });
  });

  describe('GET /api/etl/status', () => {
    it('should return sync status and validation', async () => {
      const mockStats = {
        sourceCount: 10,
        targetCount: 8,
        lastSyncTime: new Date(),
      };

      const mockValidation = {
        isValid: false,
        details: {
          sourceCount: 10,
          targetCount: 8,
          missingInTarget: 2,
          extraInTarget: 0,
          missingProductIds: ['id1', 'id2'],
          extraProductIds: [],
        },
      };

      mockProductSyncService.getStats.mockResolvedValue(mockStats);
      mockProductSyncService.validateSync.mockResolvedValue(mockValidation);

      const response = await request(app)
        .get('/api/etl/status')
        .set('Cookie', [`session=${Buffer.from(JSON.stringify({ jwt: 'valid-jwt' })).toString('base64')}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toEqual(mockStats);
      expect(response.body.validation).toEqual(mockValidation);
    });

    it('should handle status errors', async () => {
      mockProductSyncService.getStats.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/etl/status')
        .set('Cookie', [`session=${Buffer.from(JSON.stringify({ jwt: 'valid-jwt' })).toString('base64')}`]);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to get sync status');
    });
  });

  describe('GET /api/etl/validate', () => {
    it('should return validation results', async () => {
      const mockValidation = {
        isValid: true,
        details: {
          sourceCount: 10,
          targetCount: 10,
          missingInTarget: 0,
          extraInTarget: 0,
          missingProductIds: [],
          extraProductIds: [],
        },
      };

      mockProductSyncService.validateSync.mockResolvedValue(mockValidation);

      const response = await request(app)
        .get('/api/etl/validate')
        .set('Cookie', [`session=${Buffer.from(JSON.stringify({ jwt: 'valid-jwt' })).toString('base64')}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.validation).toEqual(mockValidation);
    });
  });

  describe('GET /api/etl/stats', () => {
    it('should return sync statistics', async () => {
      const mockStats = {
        sourceCount: 15,
        targetCount: 15,
        lastSyncTime: new Date(),
      };

      mockProductSyncService.getStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/etl/stats')
        .set('Cookie', [`session=${Buffer.from(JSON.stringify({ jwt: 'valid-jwt' })).toString('base64')}`]);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toEqual(mockStats);
    });
  });
});
