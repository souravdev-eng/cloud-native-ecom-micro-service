import request from 'supertest';
import app from '../../app';
import { redisClient } from '../../redisClient';
import { Product } from '../../models/productModel';

jest.mock('../../redisClient', () => ({
  redisClient: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
  getRedisClient: jest.fn(),
  connectRedis: jest.fn(),
}));

jest.mock('../../services/uploadImageToAws', () => ({
  uploadImageToAws: jest.fn().mockResolvedValue('https://test-bucket.s3.us-east-1.amazonaws.com/test.jpg'),
}));

let userToken: any;
let userPayload: any;

beforeEach(async () => {
  const { token, payload } = global.sellerSignIn();
  userToken = token;
  userPayload = payload;

  let productData1 = {
    title: 'Test data 1',
    description: 'Test description',
    originalPrice: 200,
    price: 150,
    stockQuantity: 10,
    image: 'http://test.png',
    category: 'book',
    sellerId: userPayload.id,
  };
  let productData2 = {
    title: 'Test data 2',
    description: 'Test description',
    originalPrice: 250,
    price: 190,
    stockQuantity: 10,
    image: 'http://test.png',
    category: 'book',
    sellerId: userPayload.id,
  };
  let productData3 = {
    title: 'Test data 3',
    description: 'Test description',
    originalPrice: 200,
    price: 150,
    stockQuantity: 10,
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
  it.each([
    ['1', '10'],
    ['10', '1'],
  ])('loads a different result when the cached quantity bound changes from %s to %s', async (firstBound, secondBound) => {
    await Product.updateOne({ title: 'Test data 1' }, { $set: { quantity: 15 } });
    // This fake stores SET values so the second request can hit the first request's cache entry.
    // An always-miss mock would hide a key collision.
    const values = new Map<string, string>();
    (redisClient.get as jest.Mock).mockImplementation(async (key: string) => values.get(key) ?? null);
    (redisClient.set as jest.Mock).mockImplementation(async (key: string, value: string) => {
      values.set(key, value);
      return 'OK';
    });

    const first = await request(app)
      .get(`/api/product?category=book&quantity[gte]=${firstBound}`)
      .set('Cookie', userToken)
      .expect(200);
    const second = await request(app)
      .get(`/api/product?category=book&quantity[gte]=${secondBound}`)
      .set('Cookie', userToken)
      .expect(200);

    expect(first.body.data).toHaveLength(firstBound === '1' ? 3 : 1);
    expect(second.body.data).toHaveLength(secondBound === '1' ? 3 : 1);
    expect((redisClient.get as jest.Mock).mock.calls[0][0]).not.toBe(
      (redisClient.get as jest.Mock).mock.calls[1][0],
    );
  });

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
