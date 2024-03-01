import request from 'supertest';
import connection from './config';
import app from '../app';

declare global {
  function signIn(): Promise<string[]>;
}

beforeAll(async () => {
  process.env.JWT_KEY = 'asdfasdf';
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  process.env.JWT_EXPIRE_IN = '90d';

  await connection.create();
});

beforeEach(async () => {
  await connection.clear();
});

afterAll(async () => {
  // await connection.clear();
  await connection.close();
});

global.signIn = async () => {
  const name = 'test';
  const email = 'test@test.com';
  const password = '123456';
  const passwordConform = '123456';

  const response = await request(app)
    .post('/api/users/signup')
    .send({
      name,
      email,
      password,
      passwordConform,
    })
    .expect(201);

  const cookie = response.get('Set-Cookie');

  return cookie;
};
