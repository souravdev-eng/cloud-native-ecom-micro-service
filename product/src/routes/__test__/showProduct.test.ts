import request from 'supertest';
import app from '../../app';

let userToken: any;
let userPayload: any;

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
  let productData2 = {
    title: 'Test data 2',
    description: 'Test description',
    price: 190,
    image: 'http://test.png',
    category: 'book',
    sellerId: userPayload.id,
  };
  let productData3 = {
    title: 'Test data 1',
    description: 'Test description',
    price: 150,
    image: 'http://test.png',
    category: 'book',
    sellerId: userPayload.id,
  };
  await request(app)
    .post('/api/product/new')
    .set('Cookie', userToken)
    .send(productData1)
    .expect(201);

  await request(app)
    .post('/api/product/new')
    .set('Cookie', userToken)
    .send(productData2)
    .expect(201);

  await request(app)
    .post('/api/product/new')
    .set('Cookie', userToken)
    .send(productData3)
    .expect(201);
});

describe('Show Product List', () => {
  it('should return 200 if login user is login', async () => {
    await request(app).get('/api/product').set('Cookie', global.signIn()).expect(200);
  });

  it('should return product list length 3', async () => {
    const response = await request(app).get('/api/product').set('Cookie', global.signIn());
    expect(response.body.data).toHaveLength(3);
  });

  it('should return 403 if user is not logged in first', async () => {
    await request(app).get('/api/product').expect(403);
  });
});
