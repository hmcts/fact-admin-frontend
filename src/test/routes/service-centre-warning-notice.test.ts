import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

describe('Service centre warning notice page', () => {
  const serviceCentreId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    restore();
  });

  test('renders warning notice edit page for a known service centre', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      warningNotice: null,
    } as never);

    const response = await request(app).get(`/service-centres/${serviceCentreId}/edit/warning-notice`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Warning notice');
    expect(response.text).toContain('This is limited to 250 characters');
    expect(response.text).toContain('maxlength="250"');
  });

  test('returns validation error when warning notice exceeds 250 chars', async () => {
    const getServiceCentreByIdStub = stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      warningNotice: null,
    } as never);
    const updateServiceCentreStub = stub(DataApiRequests.prototype, 'updateServiceCentre');

    const response = await request(app)
      .post(`/service-centres/${serviceCentreId}/edit/warning-notice/success`)
      .type('form')
      .send({ warningNotice: 'a'.repeat(251) });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('Warning notice must be 250 characters or fewer');
    expect(getServiceCentreByIdStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.notCalled).toBe(true);
  });

  test('trims and saves warning notice', async () => {
    const getServiceCentreByIdStub = stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    const updateServiceCentreStub = stub(DataApiRequests.prototype, 'updateServiceCentre').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      regionId: null,
      slug: 'reading-service-centre',
      warningNotice: 'Trimmed warning notice',
    } as never);

    const response = await request(app)
      .post(`/service-centres/${serviceCentreId}/edit/warning-notice/success`)
      .type('form')
      .send({ warningNotice: '  Trimmed warning notice  ' });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Warning notice saved');
    expect(response.text).toContain('Warning notice for Reading Service Centre has been saved successfully.');
    expect(getServiceCentreByIdStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.firstCall.args[0]).toMatchObject({
      id: serviceCentreId,
      warningNotice: 'Trimmed warning notice',
    });
  });
});
