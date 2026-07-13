import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

describe('Service centre general page', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';
  const serviceAreas = [
    { id: '22222222-2222-4222-8222-222222222222', name: 'Adoption' },
    { id: '33333333-3333-4333-8333-333333333333', name: 'Children' },
  ];

  beforeEach(() => {
    restore();
  });

  test('renders the general edit page for a valid known service centre', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      serviceAreaIds: [serviceAreas[0].id],
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceAreas').resolves(serviceAreas as never);

    const response = await request(app).get(`/service-centres/${serviceCentreId}/edit/general`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('General - Reading Service Centre');
    expect(response.text).toContain('Service centre name');
    expect(response.text).toContain('Enter the name of the service centre. Only capitalise the first letter.');
    expect(response.text).toContain(
      'Please specify the service areas of the service centre. This affects citizen search results.'
    );
    expect(response.text).toContain(serviceAreas[0].name);
    expect(response.text).toContain(serviceAreas[1].name);
    expect(response.text).toContain(
      `<form method="post" action="/service-centres/${serviceCentreId}/edit/general/success">`
    );
  });

  test('renders not found for an invalid UUID on GET', async () => {
    const getServiceCentreByIdStub = stub(DataApiRequests.prototype, 'getServiceCentreById');

    const response = await request(app).get('/service-centres/not-a-uuid/edit/general');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Page Not Found');
    expect(getServiceCentreByIdStub.notCalled).toBe(true);
  });

  test('updates service centre details and renders success page', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      serviceAreaIds: [serviceAreas[0].id],
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceAreas').resolves(serviceAreas as never);
    stub(DataApiRequests.prototype, 'getCourtByName').resolves(HttpStatusCode.NotFound);
    stub(DataApiRequests.prototype, 'getServiceCentreByName').resolves(HttpStatusCode.NotFound);
    const updateServiceCentreStub = stub(DataApiRequests.prototype, 'updateServiceCentre').resolves({
      id: serviceCentreId,
      name: 'Updated Service Centre',
      open: false,
      serviceAreaIds: [serviceAreas[1].id],
      slug: 'updated-service-centre',
      warningNotice: null,
    } as never);

    const response = await request(app)
      .post(`/service-centres/${serviceCentreId}/edit/general/success`)
      .type('form')
      .send(`name=Updated%20Service%20Centre&open=false&serviceAreaIds=${serviceAreas[1].id}`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('General details saved');
    expect(response.text).toContain('General details for Updated Service Centre have been saved successfully.');
    expect(response.text).toContain('Continue updating Updated Service Centre');
    expect(updateServiceCentreStub.calledOnce).toBe(true);
    expect(updateServiceCentreStub.firstCall.args[0]).toMatchObject({
      id: serviceCentreId,
      name: 'Updated Service Centre',
      open: false,
      serviceAreaIds: [serviceAreas[1].id],
    });
  });

  test('renders validation errors when service areas are missing on POST', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      serviceAreaIds: [serviceAreas[0].id],
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceAreas').resolves(serviceAreas as never);
    const updateServiceCentreStub = stub(DataApiRequests.prototype, 'updateServiceCentre');

    const response = await request(app)
      .post(`/service-centres/${serviceCentreId}/edit/general/success`)
      .type('form')
      .send('name=Updated%20Service%20Centre&open=true');

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Please specify the service areas of the service centre');
    expect(response.text).toContain('Error: General - Updated Service Centre');
    expect(updateServiceCentreStub.notCalled).toBe(true);
  });
});
