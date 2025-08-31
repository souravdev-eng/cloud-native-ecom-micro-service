import { Request, Response, NextFunction, Router } from 'express';
import { NotFoundError, requestValidation, requireAuth, BadRequestError } from '@ecom-micro/common';
import { Product } from '../entity/Product';
import { Cart } from '../entity/Cart';
import { CartCreatedPublisher } from '../queues/publisher/cartCreatedPublisher';
import { CartUpdatedPublisher } from '../queues/publisher/cartUpdatedPublisher';
import { rabbitMQWrapper } from '../rabbitMQWrapper';

const router = Router();

router.post(
  '/api/cart',
  requireAuth,
  requestValidation,
  async (req: Request, res: Response, next: NextFunction) => {
    const { productId, quantity } = req.body;
    const userId = req?.user?.id;

    const product = await Product.findOneBy({ id: productId });
    if (!product) {
      return next(new NotFoundError('Oops! Product not found'));
    }

    if (product.quantity === 0) {
      return next(new BadRequestError('Oops! Product is out of stock'));
    }

    if (quantity > product.quantity) {
      return next(new BadRequestError('Oops! Cart quantity is greater than product stock'));
    }

    const existingCart = await Cart.findOne({
      where: {
        product: { id: productId },
        userId: userId,
      },
      relations: ['product'],
    });

    const total = product.price * quantity;
    if (!existingCart) {
      // Create new cart
      const cart = Cart.create({
        userId: req?.user?.id,
        product: product,
        quantity: quantity,
      });
      await cart.save();

      // Publish CartCreated event
      await new CartCreatedPublisher(rabbitMQWrapper.channel).publish({
        cartId: cart.id,
        userId: cart.userId,
        product: {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          sellerId: product.sellerId,
          quantity: product.quantity,
        },
        cartQuantity: cart.quantity,
        total,
        version: cart.version,
      });

      res.status(201).send({
        id: cart.id,
        product: cart.product,
        total,
        quantity: cart.quantity,
      });
    } else {
      // Update existing cart
      const oldVersion = existingCart.version;
      existingCart.quantity = quantity;
      await existingCart.save();

      // Publish CartUpdated event
      await new CartUpdatedPublisher(rabbitMQWrapper.channel).publish({
        cartId: existingCart.id,
        userId: existingCart.userId,
        product: {
          id: existingCart.product.id,
          title: existingCart.product.title,
          price: existingCart.product.price,
          image: existingCart.product.image,
          sellerId: existingCart.product.sellerId,
          quantity: existingCart.product.quantity,
        },
        cartQuantity: existingCart.quantity,
        total,
        version: existingCart.version,
      });

      res.status(200).send({
        id: existingCart.id,
        product: existingCart.product,
        total,
        quantity: existingCart.quantity,
      });
    }
  }
);

export { router as newCartRoute };
