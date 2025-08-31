import { Request, Response, NextFunction, Router } from 'express';
import { NotFoundError, requestValidation, requireAuth } from '@ecom-micro/common';
import { Cart } from '../entity/Cart';
import { CartDeletedPublisher } from '../queues/publisher/cartDeletedPublisher';
import { rabbitMQWrapper } from '../rabbitMQWrapper';

const router = Router();

router.delete(
  '/api/cart/:id',
  requireAuth,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const cartId = req?.params?.id;
    const userId = req?.user?.id;

    const cart = await Cart.findOneBy({ id: cartId, userId: userId });
    if (!cart) {
      return next(new NotFoundError('Cart not found'));
    }

    // Store cart data before deletion for event publishing
    const cartData = {
      cartId: cart.id,
      userId: cart.userId,
      version: cart.version,
    };

    // Delete the cart
    await Cart.remove(cart);

    // Publish CartDeleted event
    await new CartDeletedPublisher(rabbitMQWrapper.channel).publish(cartData);

    res.status(200).send({
      message: 'Cart deleted successfully',
      cartId: cartData.cartId,
    });
  }
);

export { router as deleteCartRoute };
