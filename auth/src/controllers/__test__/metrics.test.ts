import request from 'supertest';
import app from '../../app';

it('exposes auth HTTP duration metrics for scraping', async () => {
  await request(app).get('/api/users/currentuser').expect(403);
  const response = await request(app).get('/metrics').expect(200);
  expect(response.headers['content-type']).toContain('application/openmetrics-text');
  expect(response.text).toContain('http_server_request_duration_count');
  expect(response.text).toContain('service="auth-service"');
});
