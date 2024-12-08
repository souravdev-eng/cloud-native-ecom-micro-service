import { NotFoundError, requireAuth } from '@ecom-micro/common';
import { Router, Response, Request, NextFunction } from 'express';
import { Product } from '../models/productModel';
import { getRedisClient } from '../redisClient';
import { calculateTTL } from '../utils/calculateTTL';

const router = Router();

router.get(
    '/api/product/:id',
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        const redisClient = getRedisClient();
        const redisKey = `product:${req.params.id}`;

        const cachedProduct = await redisClient.get(redisKey);

        if (cachedProduct !== null) {
            console.log('Return from Cache...');

            res.status(200).send(cachedProduct);
        } else {
            const product = await Product.findById(req.params.id);

            if (!product) {
                return next(new NotFoundError('Oops! Product is not found'));
            }

            redisClient.set(redisKey, JSON.stringify(product));
            redisClient.expire(redisKey, calculateTTL(5, 'seconds'));
            console.log('Return from Mongo...');
            res.status(200).send(product);
        }
    }
);

export { router as showProductDetailByIdRouter };
