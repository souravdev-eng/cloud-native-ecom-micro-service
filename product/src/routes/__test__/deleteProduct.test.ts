import request from 'supertest';
import app from '../../app';

let sellerToken: any;
let sellerPayload: any;
let productData: any;

beforeEach(() => {
  const { token, payload } = global.sellerSignIn();

  sellerToken = token;
  sellerPayload = payload;

  productData = {
    title: 'How to Win Friends & Influence People',
    description:
      'For more than sixty years the rock advice in this book has carried thousands of now famous people up the ladder of success in their business and personal lives. Now this previously revised and updated bestsellerId is available in trade paperback for the first time to help you achieve your maximum potential throughout the next century!',
    price: 150,
    image: 'http://test.png',
    category: 'book',
    sellerId: sellerPayload.id,
  };
});

describe('DELETE Product', () => {
  test('it should return 200 if the product deleted successfully', async () => {
    const product = await request(app)
      .post('/api/product/new')
      .set('Cookie', sellerToken)
      .send(productData)
      .expect(201);

    await request(app)
      .delete(`/api/product/${product.body.id}`)
      .set('Cookie', sellerToken)
      .expect(200);
  });

  test('it should return 404 if the product already deleted or does not exists into db', async () => {
    const product = await request(app)
      .post('/api/product/new')
      .set('Cookie', sellerToken)
      .send(productData)
      .expect(201);

    await request(app)
      .delete(`/api/product/${product.body.id}`)
      .set('Cookie', sellerToken)
      .expect(200);

    await request(app)
      .delete(`/api/product/${product.body.id}`)
      .set('Cookie', sellerToken)
      .expect(404);
  });

  test('it should return 403 if seller does not login', async () => {
    const product = await request(app)
      .post('/api/product/new')
      .set('Cookie', sellerToken)
      .send(productData)
      .expect(201);

    await request(app).delete(`/api/product/${product.body.id}`).expect(403);
  });

  test('it should return 400 if user try to delete the user', async () => {
    const user = global.signIn();
    const product = await request(app)
      .post('/api/product/new')
      .set('Cookie', sellerToken)
      .send(productData)
      .expect(201);

    await request(app).delete(`/api/product/${product.body.id}`).set('Cookie', user).expect(403);
  });
});
