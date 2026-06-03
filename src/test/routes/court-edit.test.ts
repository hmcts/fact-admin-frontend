import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

describe('Court edit page', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the court edit page for a valid known court', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);

    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Editing - Reading Crown Court');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/accessibility');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard');
    expect(response.text).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/address');
  });

  test('renders the dedicated court not found page for an invalid UUID', async () => {
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');

    const response = await request(app).get('/courts/not-a-uuid/edit');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(response.text).toContain('This court does not exist.');
    expect(getCourtByIdStub.notCalled).toBe(true);
  });

  test('renders the dedicated court not found page for a missing court', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);

    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(response.text).toContain('Return to the home page to view another court');
  });

  test('renders the generic error page when the lookup fails', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit');

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });
});
