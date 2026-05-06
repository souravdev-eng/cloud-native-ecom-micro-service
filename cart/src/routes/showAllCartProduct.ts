import { Request, Response, NextFunction, Router } from 'express';
import { requestValidation, requireAuth } from '@ecom-micro/common';
import { Product } from '../entity/Product';
import { dbClient } from '../dbConfig';
const router = Router();

router.get(
    '/api/cart/products',
    requireAuth,
    requestValidation,
    async (req: Request, res: Response, next: NextFunction) => {
        const productRepository = dbClient.getRepository(Product);
        const product = await productRepository.query("SELECT * FROM product");

        res.status(200).send({ data: product });
    }
);

export { router as showAllCartProductRoute };

