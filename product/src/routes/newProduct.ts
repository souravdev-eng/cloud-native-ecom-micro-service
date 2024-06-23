import { Router, Response, Request, NextFunction } from 'express';
import { requireAuth, restrictTo, requestValidation } from '@ecom-micro/common';
import { productValidation } from '../validation/productValidation';
import { Product } from '../models/productModel';
import { rabbitMQWrapper } from '../rabbitMQWrapper';
import { ProductCreatedPub } from '../queues/publisher/productCreatedPub';

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
      tags: req.body.tags,
    });

    await product.save();

    new ProductCreatedPub(rabbitMQWrapper.channel).publish({
      id: product.id,
      title: product.title,
      price: product.price,
      sellerId: product.sellerId,
      quantity: 10,
    });

    res.status(201).send(product);
  }
);

export { router as newProductRouter };
