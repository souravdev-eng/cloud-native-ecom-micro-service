import { Request, Response, NextFunction, Router } from 'express';
import { NotFoundError, requestValidation, requireAuth, BadRequestError } from '@ecom-micro/common';
import { Product } from '../entity/Product';
import { Cart } from '../entity/Cart';

const router = Router();

router.get(
  '/api/cart',
  requireAuth,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const carts = await Cart.find({
      where: {
        userId: req?.user?.id,
      },
      relations: ['product'],
    });
    const cartList = carts.map((cart) => ({
      cart_id: cart.id,
      title: cart.product.title,
      image: cart.product.image,
      price: cart.product.price,
      quantity: cart.quantity,
      total: cart.total,
    }));

    const totalValue = cartList.reduce((sum, cart) => sum + cart.total, 0);

    res.status(200).send({ carts: cartList, total: totalValue });
  }
);

export { router as showAllCartRoute };
