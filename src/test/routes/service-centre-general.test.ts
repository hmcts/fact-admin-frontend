import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';
import { Region } from '../../main/schemas/regionSchema';

describe('Service centre general page', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';
  const serviceAreas = [
    { id: '22222222-2222-4222-8222-222222222222', name: 'Adoption' },
    { id: '33333333-3333-4333-8333-333333333333', name: 'Children' },
  ];

  const regions: Region[] = [
    { id: '471dd8a0-d8db-49b1-8257-f42d7ac0329b', name: 'Eastern', country: 'England' },
    { id: '1e4c93c2-e39b-4aee-90d5-45a68fcb0202', name: 'North West', country: 'England' },
    { id: '01ed3123-c9c4-4c9f-9dbc-20f72c05c6ac', name: 'North East', country: 'England' },
    { id: '03a67431-c650-4298-a7e7-38270ed04506', name: 'South East', country: 'England' },
    { id: '1f02aa9a-fb39-45c3-a90a-25ae10608ab2', name: 'South West', country: 'England' },
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
    stub(DataApiRequests.prototype, 'getRegions').resolves(regions as never);

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
    expect(response.text).toContain('Service centre not found');
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
    stub(DataApiRequests.prototype, 'getRegions').resolves(regions as never);

    const response = await request(app)
      .post(`/service-centres/${serviceCentreId}/edit/general/success`)
      .type('form')
      .send(
        `name=Updated%20Service%20Centre&open=false&serviceAreaIds=${serviceAreas[1].id}&regionId=${regions[0].id}`
      );

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
    stub(DataApiRequests.prototype, 'getRegions').resolves(regions as never);
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
