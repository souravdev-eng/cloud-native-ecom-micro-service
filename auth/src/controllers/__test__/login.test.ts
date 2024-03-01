import request from 'supertest';
import app from '../../app';

describe('Login', () => {
  it('should return 201 if user Signup successfully', async () => {
    const response = await request(app)
      .post('/api/users/signup')
      .send({
        name: 'test',
        email: 'test1@gmail.com',
        password: '123456',
        passwordConform: '123456',
      })
      .expect(201);

    expect(response.get('Set-Cookie')).toBeDefined();
  });
});
