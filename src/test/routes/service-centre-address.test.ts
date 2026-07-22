import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

describe('Service centre address routes', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    restore();
  });

  test('renders address list with add button when no addresses exist', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: false,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceCentreAddressDetails').resolves([]);

    const response = await request(app).get(`/service-centres/${serviceCentreId}/edit/address?isNewSC=true`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Address');
    expect(response.text).toContain('You can have 0-1 addresses per service centre');
    expect(response.text).toContain('If you do not add an address, this service centre will be marked as closed.');
    expect(response.text).toContain(`/service-centres/${serviceCentreId}/edit/address/find`);
  });

  test('renders address list with edit and delete when one address exists', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceCentreAddressDetails').resolves([
      {
        id: '22222222-2222-4222-8222-222222222222',
        serviceCentreId,
        addressLine1: '1 Test Street',
        addressLine2: null,
        townCity: 'London',
        county: null,
        postcode: 'SW1A 1AA',
        epimId: null,
        lat: null,
        lon: null,
        addressType: 'VISIT_US',
      },
    ] as never);

    const response = await request(app).get(`/service-centres/${serviceCentreId}/edit/address`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain(
      `/service-centres/${serviceCentreId}/edit/address/find/22222222-2222-4222-8222-222222222222`
    );
    expect(response.text).toContain(
      `/service-centres/${serviceCentreId}/edit/address/delete/22222222-2222-4222-8222-222222222222`
    );
    expect(response.text).not.toContain(`/service-centres/${serviceCentreId}/edit/address/find"`);
  });

  test('renders delete confirmation page', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceCentreAddressDetailsById').resolves({
      id: '22222222-2222-4222-8222-222222222222',
      serviceCentreId,
      addressLine1: '1 Test Street',
      addressLine2: null,
      townCity: 'London',
      county: null,
      postcode: 'SW1A 1AA',
      epimId: null,
      lat: null,
      lon: null,
      addressType: 'VISIT_US',
    } as never);

    const response = await request(app).get(
      `/service-centres/${serviceCentreId}/edit/address/delete/22222222-2222-4222-8222-222222222222`
    );

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Are you sure you want to delete this address?');
    expect(response.text).toContain('Service centre name');
    expect(response.text).toContain('Delete address');
  });

  test('deletes address and renders success page', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: true,
      slug: 'reading-service-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceCentreAddressDetails').resolves([
      {
        id: '22222222-2222-4222-8222-222222222222',
        serviceCentreId,
        addressLine1: '1 Test Street',
        addressLine2: null,
        townCity: 'London',
        county: null,
        postcode: 'SW1A 1AA',
        epimId: null,
        lat: null,
        lon: null,
        addressType: 'VISIT_US',
      },
    ] as never);
    const deleteStub = stub(DataApiRequests.prototype, 'deleteServiceCentreAddress').resolves(HttpStatusCode.NoContent);

    const response = await request(app).post(
      `/service-centres/${serviceCentreId}/edit/address/delete/success/22222222-2222-4222-8222-222222222222`
    );

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(deleteStub.calledOnce).toBe(true);
    expect(response.text).toContain('Address deleted:');
    expect(response.text).toContain('You have removed this address for Reading Service Centre');
  });

  test('renders not found for invalid UUID in address routes', async () => {
    const response = await request(app).get('/service-centres/not-a-uuid/edit/address');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Service centre not found');
  });
});
