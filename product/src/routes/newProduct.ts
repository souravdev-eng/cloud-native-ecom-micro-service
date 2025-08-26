import { Router, Response, Request, NextFunction } from 'express';
import { requireAuth, restrictTo, requestValidation, NotAuthorizedError } from '@ecom-micro/common';
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
    const sellerId = req?.user?.id;

    if (!sellerId) {
      throw new NotAuthorizedError();
    }

    const product = Product.build({
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      image: req.body.image,
      sellerId: sellerId,
      price: req.body.price,
      quantity: req.body.quantity,
      tags: req.body.tags,
    });

    await product.save();

    new ProductCreatedPub(rabbitMQWrapper.channel).publish({
      id: product.id,
      title: product.title,
      price: product.price,
      sellerId: product.sellerId.toString(),
      image: product.image,
      quantity: product.quantity!,
    });

    res.status(201).send(product);
  }
);

export { router as newProductRouter };
