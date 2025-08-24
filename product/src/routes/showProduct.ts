import { requireAuth } from '@ecom-micro/common';
import { Router, Response, Request, NextFunction } from 'express';
import { Product } from '../models/productModel';
import { ProductAPIFeature } from '../utils/productApiFeature';

const router = Router();

router.get('/api/product', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  const productApiFeature = new ProductAPIFeature(Product.find({}), req.query).filter().sort();

  const product = await productApiFeature.query;

  res.status(200).send(product);
});

export { router as showProductRouter };
