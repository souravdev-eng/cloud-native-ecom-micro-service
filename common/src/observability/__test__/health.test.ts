import express from 'express';
import request from 'supertest';
import { createHealthRoutes } from '../health';

it('reports liveness without running dependency checks', async () => {
  const app = express();
  let checked = false;
  app.use(createHealthRoutes({
    mongodb: () => { checked = true; throw new Error('unavailable'); },
  }));

  const response = await request(app).get('/healthz').expect(200);
  expect(response.body).toEqual({ status: 'ok' });
  expect(checked).toBe(false);
});

it('reports every passing dependency as ready', async () => {
  const app = express();
  app.use(createHealthRoutes({ mongodb: async () => {}, rabbitmq: () => {} }));

  const response = await request(app).get('/readyz').expect(200);
  expect(response.body).toEqual({
    status: 'ok', checks: { mongodb: 'ok', rabbitmq: 'ok' },
  });
});

it('names failed dependencies while still running and reporting every check', async () => {
  const app = express();
  app.use(createHealthRoutes({
    mongodb: () => { throw new Error('secret connection string'); },
    rabbitmq: async () => { throw new Error('unavailable'); },
    redis: async () => {},
  }));

  const response = await request(app).get('/readyz').expect(503);
  expect(response.body).toEqual({
    status: 'error', checks: { mongodb: 'error', rabbitmq: 'error', redis: 'ok' },
  });
});

it('bounds every check independently and reports timeouts alongside passing checks', async () => {
  const app = express();
  app.use(createHealthRoutes({
    mongodb: () => new Promise<void>(() => {}),
    rabbitmq: () => new Promise<void>(() => {}),
    redis: async () => {},
  }, { timeoutMs: 20 }));

  const response = await request(app).get('/readyz').expect(503);
  expect(response.body).toEqual({
    status: 'error', checks: { mongodb: 'timeout', rabbitmq: 'timeout', redis: 'ok' },
  });
});
