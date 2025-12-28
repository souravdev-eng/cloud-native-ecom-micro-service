import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, restrictTo } from '@ecom-micro/common';
import { ProductAPIFeature } from '../utils/productApiFeature';
import { Product } from '../models/productModel';
const router = Router();

router.get(
  '/api/product/seller',
  requireAuth,
  restrictTo('seller', 'admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    const sellerId = req.user.id;
    const productApiFeature = new ProductAPIFeature(Product.find({ sellerId }), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const product = await productApiFeature.executePaginated();
    res.status(200).send(product);
  }
);

export { router as showAdminProduct };
