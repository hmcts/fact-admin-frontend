import { HttpStatusCode } from 'axios';
import request from 'supertest';

import { app } from '../../main/app';

describe('Service centre edit page', () => {
  test('renders the service centre edit link page', async () => {
    const response = await request(app).get('/service-centres/22222222-2222-4222-8222-222222222222/edit');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Editing service centre');
    expect(response.text).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit/general');
    expect(response.text).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit/warning-notice');
    expect(response.text).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit/address');
    expect(response.text).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit/contact-details');
    expect(response.text).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit/cases-heard');
  });

  test('renders not found for an invalid UUID', async () => {
    const response = await request(app).get('/service-centres/not-a-uuid/edit');

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
