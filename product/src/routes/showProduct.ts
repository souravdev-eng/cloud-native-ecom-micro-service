import { requireAuth } from '@ecom-micro/common';
import { Router, Response, Request, NextFunction } from 'express';
import { Product } from '../models/productModel';

const router = Router();

router.get(
    '/api/product',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        const product = await Product.find({});

        res.status(200).send(product);
    }
);

export { router as showProductRouter };
