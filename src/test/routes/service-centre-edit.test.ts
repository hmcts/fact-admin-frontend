import { HttpStatusCode } from 'axios';
import request from 'supertest';

import { app } from '../../main/app';

describe('Service centre edit page', () => {
  test('renders the generic not found page until service-centre editing is implemented', async () => {
    const response = await request(app).get('/service-centres/22222222-2222-4222-8222-222222222222/edit');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Page Not Found');
  });

  test('redirects unauthenticated users to sign in', async () => {
    const response = await request(app)
      .get('/service-centres/22222222-2222-4222-8222-222222222222/edit')
      .set('x-test-unauthenticated', 'true');

    expect(response.status).toBe(HttpStatusCode.Found);
    expect(response.headers.location).toBe('/sso/login');
  });
});
