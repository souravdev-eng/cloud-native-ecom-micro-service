import request from 'supertest';
import app from '../../app';

it('reports auth liveness without credentials or a RabbitMQ connection', async () => {
  const response = await request(app).get('/healthz').expect(200);
  expect(response.body).toEqual({ status: 'ok' });
});
