import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

describe('Service centre cases heard page', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    restore();
  });

  test('renders the cases heard page for a valid known service centre', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceCentreAreasOfLaw').resolves([
      {
        areaOfLawType: {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Divorce',
          nameCy: 'Ysgariad',
        },
        selected: true,
      },
      {
        areaOfLawType: {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Probate',
          nameCy: 'Profiant',
        },
        selected: false,
      },
    ] as never);

    const response = await request(app).get(`/service-centres/${serviceCentreId}/edit/cases-heard`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Cases heard');
    expect(response.text).toContain('Select the types of cases heard at this service centre.');
    expect(response.text).toContain('Divorce');
    expect(response.text).toContain('Probate');
  });

  test('renders not found for an invalid UUID', async () => {
    const getServiceCentreByIdStub = stub(DataApiRequests.prototype, 'getServiceCentreById');

    const response = await request(app).get('/service-centres/not-a-uuid/edit/cases-heard');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Page Not Found');
    expect(getServiceCentreByIdStub.notCalled).toBe(true);
  });

  test('updates selected areas of law and renders success page', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    const updateStub = stub(DataApiRequests.prototype, 'updateServiceCentreAreasOfLaw').resolves(HttpStatusCode.Ok);

    const response = await request(app)
      .post(`/service-centres/${serviceCentreId}/edit/cases-heard/success`)
      .type('form')
      .send('areasOfLaw=22222222-2222-4222-8222-222222222222&areasOfLaw=33333333-3333-4333-8333-333333333333');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Cases heard saved');
    expect(response.text).toContain('Cases heard for Reading Service Centre have been saved successfully.');
    expect(updateStub.calledOnce).toBe(true);
    expect(updateStub.firstCall.args[0]).toEqual({
      areasOfLaw: ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'],
      serviceCentreId,
    });
  });

  test('renders validation error when no areas of law are selected', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceCentreAreasOfLaw').resolves([
      {
        areaOfLawType: {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Divorce',
          nameCy: 'Ysgariad',
        },
        selected: true,
      },
    ] as never);
    const updateStub = stub(DataApiRequests.prototype, 'updateServiceCentreAreasOfLaw');

    const response = await request(app)
      .post(`/service-centres/${serviceCentreId}/edit/cases-heard/success`)
      .type('form')
      .send('');

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Select at least one type of case heard at this service centre.');
    expect(updateStub.notCalled).toBe(true);
  });
});
