import request from 'supertest';
import app from '../../app';

describe('Signup success test case', () => {
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

describe('Signup error test case', () => {
  it('should return 400 if user provide duplicate email address', async () => {
    await request(app)
      .post('/api/users/signup')
      .send({
        name: 'test',
        email: 'test2@gmail.com',
        password: '123456',
        passwordConform: '123456',
      })
      .expect(201);
    await request(app)
      .post('/api/users/signup')
      .send({
        name: 'test',
        email: 'test2@gmail.com',
        password: '123456',
        passwordConform: '123456',
      })
      .expect(400);
  });

  it('should return 400 if user provide invalid email address', async () => {
    await request(app)
      .post('/api/users/signup')
      .send({
        name: 'test',
        email: 'testgmail.com',
        password: '123456',
        passwordConform: '123456',
      })
      .expect(400);
  });

  it('should return 400 if user does not provide required properties', async () => {
    await request(app)
      .post('/api/users/signup')
      .send({
        email: 'test@gmail.com',
        password: '123456',
        passwordConform: '123456',
      })
      .expect(400);
    await request(app)
      .post('/api/users/signup')
      .send({
        name: 'test',
        password: '123456',
        passwordConform: '123456',
      })
      .expect(400);

    await request(app)
      .post('/api/users/signup')
      .send({
        name: 'test',
        email: 'test@gmail.com',
        passwordConform: '123456',
      })
      .expect(400);
  });

  it('should return 400 if user password and passwordConform does not match', async () => {
    await request(app)
      .post('/api/users/signup')
      .send({
        name: 'test',
        email: 'test2@gmail.com',
        password: '123456',
        passwordConform: '1234567',
      })
      .expect(400);
  });
});
