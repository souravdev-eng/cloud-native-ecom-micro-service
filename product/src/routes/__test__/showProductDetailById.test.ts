import request from 'supertest';
import app from '../../app';

let userToken: any;
let userPayload: any;
let product: any;

beforeEach(async () => {
  const { token, payload } = global.sellerSignIn();
  userToken = token;
  userPayload = payload;

  let productData1 = {
    title: 'Test data 1',
    description: 'Test description',
    price: 150,
    image: 'http://test.png',
    category: 'book',
    sellerId: userPayload.id,
  };

  const productData = await request(app)
    .post('/api/product/new')
    .set('Cookie', userToken)
    .send(productData1)
    .expect(201);

  product = productData.body;
});

describe('SHOW PRODUCT BY ID', () => {
  test('should return 200 if product found', async () => {
    await request(app).get(`/api/product/${product.id}`).set('Cookie', userToken).expect(200);
  });

  test('should return 403 if user does not login', async () => {
    await request(app).get(`/api/product/${product.id}`).expect(403);
  });

  test('should return 404 if product does not found', async () => {
    await request(app).get(`/api/product/dysgasg55454`).set('Cookie', userToken).expect(404);
  });
});
