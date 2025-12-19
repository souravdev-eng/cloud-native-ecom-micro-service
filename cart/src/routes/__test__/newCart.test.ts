import request from 'supertest';
import app from '../../app';
import { Product } from '../../entity/Product';

describe('POST /api/cart - Create Cart', () => {
    let userToken: string[];
    let product: Product;

    beforeEach(async () => {
        userToken = global.signIn();
        product = await global.createTestProduct();
    });

    it('should return 201 when creating a new cart item', async () => {
        const response = await request(app)
            .post('/api/cart')
            .set('Cookie', userToken)
            .send({
                productId: product.id,
                quantity: 2,
            })
            .expect(201);

        expect(response.body.product.id).toEqual(product.id);
        expect(response.body.quantity).toEqual(2);
        expect(response.body.total).toEqual(product.price * 2);
    });

    it('should return 200 when updating an existing cart item', async () => {
        // First create a cart
        await request(app)
            .post('/api/cart')
            .set('Cookie', userToken)
            .send({
                productId: product.id,
                quantity: 1,
            })
            .expect(201);

        // Update the cart with new quantity
        const response = await request(app)
            .post('/api/cart')
            .set('Cookie', userToken)
            .send({
                productId: product.id,
                quantity: 3,
            })
            .expect(200);

        expect(response.body.quantity).toEqual(3);
        expect(response.body.total).toEqual(product.price * 3);
    });

    it('should return 404 when product does not exist', async () => {
        await request(app)
            .post('/api/cart')
            .set('Cookie', userToken)
            .send({
                productId: 'non-existent-product-id',
                quantity: 1,
            })
            .expect(404);
    });

    it('should return 400 when product is out of stock', async () => {
        const outOfStockProduct = await global.createTestProduct({
            id: 'out-of-stock-product',
            quantity: 0,
        });

        await request(app)
            .post('/api/cart')
            .set('Cookie', userToken)
            .send({
                productId: outOfStockProduct.id,
                quantity: 1,
            })
            .expect(400);
    });

    it('should return 400 when cart quantity exceeds product stock', async () => {
        await request(app)
            .post('/api/cart')
            .set('Cookie', userToken)
            .send({
                productId: product.id,
                quantity: 100, // exceeds default quantity of 10
            })
            .expect(400);
    });

    it('should return 403 when user is not authenticated', async () => {
        await request(app)
            .post('/api/cart')
            .send({
                productId: product.id,
                quantity: 1,
            })
            .expect(403);
    });
});

