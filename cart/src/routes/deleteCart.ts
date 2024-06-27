import { Request, Response, NextFunction, Router } from 'express';
import { NotFoundError, requestValidation, requireAuth } from '@ecom-micro/common';
import { Cart } from '../entity/Cart';

const router = Router();

router.delete(
  '/api/cart/:id',
  requireAuth,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const cartId = req?.params?.id;

    const cart = await Cart.findOneBy({ id: cartId });
    if (!cart) {
      return next(new NotFoundError('Cart not found'));
    }

    await Cart.remove(cart);
    res.status(200).send({ message: 'Cart deleted successfully' });
  }
);

export { router as deleteCartRoute };
