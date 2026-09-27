import express from 'express';
import request from 'supertest';
import { mountObservability } from '../http';
import { captureStdout } from '../../test/captureStdout';

describe('Express observability bundle', () => {
  it('counts requests under the route template and masks secret query values in one access log', async () => {
    const app = express();
    mountObservability(app, { service: 'product-service' });
    app.get('/product/:id', (_req, res) => res.sendStatus(200));
    const stdout = captureStdout();
    try {
      await request(app).get('/product/123?token=secret-value').expect(200);
      await request(app).get('/product/456?token=secret-value').expect(200);
      const metrics = await request(app).get('/metrics').expect(200);
      expect(metrics.headers['content-type']).toContain('application/openmetrics-text');
      expect(metrics.text).toContain('http_server_request_duration_bucket');
      expect(metrics.text).toContain('http_server_request_duration_count{service="product-service",environment="test",method="GET",route="/product/:id",status_class="2xx"} 2');
      expect(metrics.text).toContain('route="/product/:id"');
      expect(metrics.text).not.toContain('/product/123');
      const access = (await stdout.json()).filter((line) => line.message === 'HTTP request');
      expect(access).toHaveLength(3);
      expect(access.filter((line) => line.url === '/metrics')).toHaveLength(1);
      expect(access[0].url).toContain('token=[REDACTED]');
      expect(JSON.stringify(access)).not.toContain('secret-value');
    } finally {
      stdout.restore();
    }
  });
});
