import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

describe('Add service centre page', () => {
  const regions = [{ country: 'england', id: '22222222-2222-4222-8222-222222222222', name: 'South East' }];
  const serviceAreas = [{ id: '33333333-3333-4333-8333-333333333333', name: 'Money claims' }];

  beforeEach(() => {
    restore();
  });

  test('renders the add service centre page for admin users', async () => {
    stub(DataApiRequests.prototype, 'getRegions').resolves(regions);
    stub(DataApiRequests.prototype, 'getServiceAreas').resolves(serviceAreas);

    const response = await request(app).get('/add-service-centre');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Add new service centre');
    expect(response.text).toContain('Service centre will be closed by default.');
    expect(response.text).toContain('Money claims');
  });

  test('renders the add service centre page for super admin users', async () => {
    stub(DataApiRequests.prototype, 'getRegions').resolves(regions);
    stub(DataApiRequests.prototype, 'getServiceAreas').resolves(serviceAreas);

    const response = await request(app).get('/add-service-centre').set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Add new service centre');
  });

  test('redirects unauthenticated users to sign in', async () => {
    const response = await request(app).get('/add-service-centre').set('x-test-unauthenticated', 'true');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/sso/login');
  });

  test('re-renders the add service centre page with validation errors', async () => {
    stub(DataApiRequests.prototype, 'getRegions').resolves(regions);
    stub(DataApiRequests.prototype, 'getServiceAreas').resolves(serviceAreas);
    const createServiceCentreStub = stub(DataApiRequests.prototype, 'createServiceCentre');

    const response = await request(app).post('/add-service-centre').send({ name: 'Te', regionId: '' });

    expect(response.status).toBe(200);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Service centre name should be between 5 and 200 characters');
    expect(response.text).toContain('Select a region for the service centre');
    expect(response.text).toContain('Please specify the service areas of the service centre');
    expect(createServiceCentreStub.notCalled).toBe(true);
  });

  test('renders the loading page when a service centre is created', async () => {
    const serviceCentre = {
      createdAt: '2026-06-10T10:00:00Z',
      id: '11111111-1111-4111-8111-111111111111',
      lastUpdatedAt: '2026-06-10T10:00:00Z',
      name: 'National Business Centre',
      open: false,
      regionId: regions[0].id,
      serviceAreaIds: [serviceAreas[0].id],
      slug: 'national-business-centre',
      warningNotice: null,
    };
    stub(DataApiRequests.prototype, 'getRegions').resolves(regions);
    stub(DataApiRequests.prototype, 'getServiceAreas').resolves(serviceAreas);
    stub(DataApiRequests.prototype, 'getCourtByName').resolves(404);
    stub(DataApiRequests.prototype, 'getServiceCentreByName').resolves(404);
    const createServiceCentreStub = stub(DataApiRequests.prototype, 'createServiceCentre').resolves(serviceCentre);

    const response = await request(app).post('/add-service-centre').send({
      name: serviceCentre.name,
      regionId: serviceCentre.regionId,
      serviceAreaIds: serviceAreas[0].id,
    });

    expect(response.status).toBe(200);
    expect(
      createServiceCentreStub.calledWith({
        name: serviceCentre.name,
        open: false,
        regionId: serviceCentre.regionId,
        serviceAreaIds: [serviceAreas[0].id],
      })
    ).toBe(true);
    expect(response.text).toContain('New service centre has been created');
    expect(response.text).toContain(`/service-centres/${serviceCentre.id}/edit/address`);
    expect(response.text).toContain('hods-loading-spinner');
  });

  test('renders the service centre address page after create flow', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'National Business Centre',
      open: false,
      slug: 'national-business-centre',
      warningNotice: null,
    } as never);
    stub(DataApiRequests.prototype, 'getServiceCentreAddressDetails').resolves([]);

    const response = await request(app).get('/service-centres/11111111-1111-4111-8111-111111111111/edit/address');

    expect(response.status).toBe(200);
    expect(response.text).toContain('You can have 0-1 addresses per service centre');
    expect(response.text).toContain('If you do not add an address, this service centre will be marked as closed.');
  });
});
