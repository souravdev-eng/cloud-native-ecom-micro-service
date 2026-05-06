import request from 'supertest';
import app from '../../app';
import { Product } from '../../entity/Product';

describe('DELETE /api/cart/:id - Delete Cart Item', () => {
  let userToken: string[];
  let userId: string;
  let product: Product;

  beforeEach(async () => {
    userId = 'test-user-delete';
    userToken = global.signIn(userId);
    product = await global.createTestProduct();
  });

  it('should return 200 when cart item is deleted successfully', async () => {
    // Create a cart item first
    const createResponse = await request(app)
      .post('/api/cart')
      .set('Cookie', userToken)
      .send({ productId: product.id, quantity: 1 })
      .expect(201);

    const cartId = createResponse.body.id;

    // Delete the cart item
    const response = await request(app)
      .delete(`/api/cart/${cartId}`)
      .set('Cookie', userToken)
      .expect(200);

    expect(response.body.message).toEqual('Cart deleted successfully');
    expect(response.body.cartId).toEqual(cartId);

    // Verify the cart is actually deleted
    const getResponse = await request(app)
      .get('/api/cart')
      .set('Cookie', userToken)
      .expect(200);

    expect(getResponse.body.carts).toHaveLength(0);
  });

  it('should return 404 when cart item does not exist', async () => {
    // Use a valid UUID format that doesn't exist in the database
    await request(app)
      .delete('/api/cart/00000000-0000-0000-0000-000000000000')
      .set('Cookie', userToken)
      .expect(404);
  });

  it('should return 404 when trying to delete another users cart', async () => {
    // Create a cart item for first user
    const createResponse = await request(app)
      .post('/api/cart')
      .set('Cookie', userToken)
      .send({ productId: product.id, quantity: 1 })
      .expect(201);

    const cartId = createResponse.body.id;

    // Try to delete with different user
    const otherUserToken = global.signIn('other-user-id');
    await request(app)
      .delete(`/api/cart/${cartId}`)
      .set('Cookie', otherUserToken)
      .expect(404);
  });

  it('should return 403 when user is not authenticated', async () => {
    await request(app)
      .delete('/api/cart/some-cart-id')
      .expect(403);
  });
});

