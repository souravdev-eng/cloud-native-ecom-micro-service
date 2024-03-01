import { Router, Response, Request, NextFunction } from 'express';
import { NotFoundError, requireAuth, restrictTo } from '@ecom-micro/common';
import { Product } from '../models/productModel';
import { ProductDeletedPublisher } from '../events/publishers/productDeletedPublisher';
import { natsWrapper } from '../natsWrapper';

const router = Router();

router.delete(
  '/api/product/:id',
  requireAuth,
  restrictTo('seller'),
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return next(new NotFoundError('Oops! Product is not found'));
    }

    new ProductDeletedPublisher(natsWrapper.client).publish({
      id: product.id,
    });

    res.status(200).send({ product: null });
  }
);

export { router as productDeleteRouter };
