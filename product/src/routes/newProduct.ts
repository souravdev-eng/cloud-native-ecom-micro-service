import { Router, Response, Request, NextFunction } from 'express';
import { requireAuth, restrictTo, requestValidation } from '@ecom-micro/common';
import { ProductCreatedPublisher } from '../events/publishers/productCreatedPublisher';
import { productValidation } from '../validation/productValidation';
import { Product } from '../models/productModel';
import { natsWrapper } from '../natsWrapper';

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

    new ProductCreatedPublisher(natsWrapper.client).publish({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      sellerId: product.sellerId,
    });

    res.status(201).send(product);
  }
);

export { router as newProductRouter };
