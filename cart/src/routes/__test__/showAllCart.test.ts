import request from 'supertest';
import app from '../../app';
import { Product } from '../../entity/Product';

describe('GET /api/cart - Show All Cart Items', () => {
  let userToken: string[];
  let userId: string;
  let product1: Product;
  let product2: Product;

  beforeEach(async () => {
    userId = 'test-user-for-cart';
    userToken = global.signIn(userId);

    product1 = await global.createTestProduct({
      id: 'product-1',
      title: 'Product 1',
      price: 100,
    });

    product2 = await global.createTestProduct({
      id: 'product-2',
      title: 'Product 2',
      price: 200,
    });
  });

  it('should return 200 and empty cart list when user has no cart items', async () => {
    const response = await request(app)
      .get('/api/cart')
      .set('Cookie', userToken)
      .expect(200);

    expect(response.body.carts).toHaveLength(0);
    expect(response.body.total).toEqual(0);
  });

  it('should return 200 with cart items for the authenticated user', async () => {
    // Create cart items
    await request(app)
      .post('/api/cart')
      .set('Cookie', userToken)
      .send({ productId: product1.id, quantity: 2 })
      .expect(201);

    await request(app)
      .post('/api/cart')
      .set('Cookie', userToken)
      .send({ productId: product2.id, quantity: 1 })
      .expect(201);

    const response = await request(app)
      .get('/api/cart')
      .set('Cookie', userToken)
      .expect(200);

    expect(response.body.carts).toHaveLength(2);
    expect(response.body.total).toEqual(100 * 2 + 200 * 1); // 400
  });

  it('should not return cart items belonging to other users', async () => {
    // Create cart for first user
    await request(app)
      .post('/api/cart')
      .set('Cookie', userToken)
      .send({ productId: product1.id, quantity: 1 })
      .expect(201);

    // Create cart for second user
    const otherUserToken = global.signIn('other-user-id');
    await request(app)
      .post('/api/cart')
      .set('Cookie', otherUserToken)
      .send({ productId: product2.id, quantity: 2 })
      .expect(201);

    // First user should only see their own cart
    const response = await request(app)
      .get('/api/cart')
      .set('Cookie', userToken)
      .expect(200);

    expect(response.body.carts).toHaveLength(1);
    expect(response.body.carts[0].product_id).toEqual(product1.id);
  });

  it('should return 403 when user is not authenticated', async () => {
    await request(app)
      .get('/api/cart')
      .expect(403);
  });
});

