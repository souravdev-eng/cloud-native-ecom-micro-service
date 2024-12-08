import { Request, Response, NextFunction, Router } from 'express';
import { requestValidation, requireAuth } from '@ecom-micro/common';
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
            product_id: cart.product.id,
            cart_id: cart.id,
            title: cart.product.title,
            image: cart.product.image,
            price: cart.product.price,
            quantity: cart.quantity,
            total: cart.product.price * cart.quantity,
        }));

        const totalValue = cartList.reduce((sum, cart) => sum + cart.total, 0);

        res.status(200).send({ carts: cartList, total: totalValue });
    }
);

export { router as showAllCartRoute };
