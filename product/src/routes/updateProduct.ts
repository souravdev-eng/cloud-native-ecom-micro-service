import {
  restrictTo,
  requireAuth,
  NotFoundError,
  BadRequestError,
  requestValidation,
} from '@ecom-micro/common';
import { Router, Response, Request, NextFunction } from 'express';

import { Product } from '../models/productModel';
import { ProductUpdatePub } from '../queues/publisher/productUpdatePub';
import { rabbitMQWrapper } from '../rabbitMQWrapper';

const router = Router();

router.patch(
  '/api/product/:id',
  requireAuth,
  restrictTo('seller', 'admin'),
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const category = ['phone', 'book', 'Fashions', 'other'];

    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new NotFoundError('Oops! Product is not found');
    }

    product.set({
      title: req.body.title ? req.body.title : product.title,
      category: req.body.category ? req.body.category : product.category,
      description: req.body.description ? req.body.description : product.description,
      image: req.body.image ? req.body.image : product.image,
      price: req.body.price ? req.body.price : product.price,
      quantity: req.body.quantity ? req.body.quantity : product.quantity,
      tags: req.body.tags ? req.body.tags : product.tags,
      rating: req.body.rating ? req.body.rating : product.rating,
    });

    await product.save();

    new ProductUpdatePub(rabbitMQWrapper.channel).publish({
      id: product.id,
      title: product.title,
      image: product.image,
      price: product.price,
      quantity: product.quantity!,
      sellerId: product.sellerId.toString(),
    });

    res.status(200).send(product);
  }
);

export { router as productUpdateRouter };
