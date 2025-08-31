import { Router } from 'express';
import { requireAuth, requestValidation } from '@ecom-micro/common';
import { createOrder } from '../controllers/createOrder';
import { orderValidation } from '../validation/orderValidation';

const router = Router();

router.post('/api/order', requireAuth, orderValidation, requestValidation, createOrder);

export { router as createOrderRoute };
