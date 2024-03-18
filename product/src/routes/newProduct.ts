import { Router, Response, Request, NextFunction } from 'express';
import { requireAuth, restrictTo, requestValidation } from '@ecom-micro/common';
import { productValidation } from '../validation/productValidation';
import { Product } from '../models/productModel';

const router = Router();

router.post(
  '/api/product/new',
  requireAuth,
  restrictTo('seller'),
  productValidation,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const product = Product.build({
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      image: req.body.image,
      sellerId: req.user.id,
      price: req.body.price,
    });

    await product.save();

    res.status(201).send(product);
  }
);

export { router as newProductRouter };
