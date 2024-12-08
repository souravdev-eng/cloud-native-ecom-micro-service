import { Request, Response, NextFunction, Router } from 'express';
import {
    NotFoundError,
    requestValidation,
    requireAuth,
    BadRequestError,
} from '@ecom-micro/common';
import { Product } from '../entity/Product';
import { Cart } from '../entity/Cart';

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

        if (quantity > product.quantity) {
            return next(
                new BadRequestError(
                    'Oops! Cart quantity is greater than product stock'
                )
            );
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
            const cart = Cart.create({
                userId: req?.user?.id,
                product: product,
            });
            await cart.save();
            res.status(201).send({
                id: cart.id,
                product: cart.product,
                total,
            });
        } else {
            existingCart.quantity = quantity;
            await existingCart.save();
            res.status(200).send({
                id: existingCart.id,
                product: existingCart.product,
                total,
            });
        }
    }
);

export { router as newCartRoute };
