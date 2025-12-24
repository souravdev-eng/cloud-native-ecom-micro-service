import { Router } from 'express';
import { requireAuth } from '@ecom-micro/common';
import { createPaymentIntent, confirmPayment, stripeWebhook } from '../controllers/payment';
import express from 'express';

const router = Router();

// Payment intent routes (require authentication)
router.post('/api/order/:orderId/payment-intent', requireAuth, createPaymentIntent);
router.post('/api/order/:orderId/confirm-payment', requireAuth, confirmPayment);

// Webhook route - must use raw body parser for signature verification
// This is handled separately in app.ts

export { router as paymentRoutes };

// Separate router for webhook with raw body
const webhookRouter = Router();
webhookRouter.post(
    '/api/order/webhook',
    express.raw({ type: 'application/json' }),
    stripeWebhook
);

export { webhookRouter as webhookRoutes };

