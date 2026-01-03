import { Router } from 'express';
import { param, query } from 'express-validator';
import { requireAuth, requestValidation } from '@ecom-micro/common';
import { getUserOrders, getOrderById } from '../controllers/getOrders';
import { getOrdersSummery, getOrdersByStatus } from '../controllers/getOrderReport';

const router = Router();

// Validation middleware for pagination
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

// Validation middleware for order ID
const orderIdValidation = [
  param('orderId').notEmpty().isMongoId().withMessage('Valid order ID is required'),
];

// GET /api/order/report - Get seller's order report (must be before :orderId)
router.get('/api/order/report/summery', requireAuth, getOrdersSummery);
router.get('/api/order/report/by-status', requireAuth, getOrdersByStatus);
router.get('/api/order/report/recent', requireAuth, getOrdersByStatus);
router.get('/api/order/report/trends', requireAuth, getOrdersByStatus);

// GET /api/order - Get user's orders with pagination
router.get('/api/order', requireAuth, getUserOrders);

// GET /api/order/:orderId - Get specific order by ID
router.get('/api/order/:orderId', requireAuth, orderIdValidation, requestValidation, getOrderById);

export { router as getOrdersRoute };
