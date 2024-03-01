import { Request, Response, NextFunction, Router } from 'express';
import { NotFoundError, requestValidation, requireAuth } from '@ecom-micro/common';
import { cartValidation } from '../validation/cartValidationSchema';
import { Product } from '../entity/Product';
import { Cart } from '../entity/Cart';

const router = Router();

router.post(
  '/api/cart/new',
  requireAuth,
  cartValidation,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findOneBy({ id: req.body.productId });
    const existingCart = await Cart.findOneBy({ productId: req.body.productId });

    if (product && !existingCart) {
      const cart = Cart.create({
        title: product?.title,
        image: product?.image,
        price: product?.price,
        userId: req?.user?.id,
        productId: product?.id,
      });

      await cart.save();
      res.status(201).send(cart);
    }
    if (product && existingCart) {
      const existCart = Cart.merge(existingCart, { quantity: req.body.quantity });
      await existCart.save();
      res.status(200).send(existCart);
    } else {
      return next(new NotFoundError('Oops! Product not found'));
    }
  }
);

export { router as newCartRoute };
