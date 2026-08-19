import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { CourtApi } from '../../main/requests/CourtApi';

describe('Building facilities page', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    restore();
  });

  test('renders edit page for a valid known court', async () => {
    stub(CourtApi.prototype, 'getCourtById').resolves({ id: courtId, name: 'Reading Crown Court' } as never);
    stub(CourtApi.prototype, 'getBuildingFacilities').resolves({
      id: 'fac-1',
      courtId,
      parking: true,
      waitingArea: true,
      waitingAreaChildren: true,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
      freeWaterDispensers: true,
      snackVendingMachines: false,
      drinkVendingMachines: false,
      cafeteria: false,
    } as never);

    const response = await request(app).get(`/courts/${courtId}/edit/building-facilities`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Building Facilities');
    expect(response.text).toContain('Are separate waiting areas for children available?');
    expect(response.text).toContain('aria-label="Breadcrumb"');
    expect(response.text).toContain('<a class="govuk-breadcrumbs__link" href="/">Home</a>');
    expect(response.text).toContain(
      `<a class="govuk-breadcrumbs__link" href="/courts/${courtId}/edit">Edit Reading Crown Court</a>`
    );
  });

  test('renders edit page with no pre-selection when facilities are missing', async () => {
    stub(CourtApi.prototype, 'getCourtById').resolves({ id: courtId, name: 'Reading Crown Court' } as never);
    stub(CourtApi.prototype, 'getBuildingFacilities').resolves(null as never);

    const response = await request(app).get(`/courts/${courtId}/edit/building-facilities`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Building Facilities');
  });

  test('renders dedicated not found page for invalid UUID', async () => {
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById');

    const response = await request(app).get('/courts/not-a-uuid/edit/building-facilities');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getCourtByIdStub.notCalled).toBe(true);
  });

  test('re-renders edit page with validation message when waitingAreaChildren is missing', async () => {
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const updateStub = stub(CourtApi.prototype, 'updateBuildingFacilities').resolves({
      courtId,
      waitingArea: true,
    } as never);

    const response = await request(app).post(`/courts/${courtId}/edit/building-facilities/success`).type('form').send({
      parking: 'true',
      waitingArea: 'true',
      quietRoom: 'false',
      babyChanging: 'false',
      wifi: 'true',
    });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Select if a separate waiting area is available for children');
    expect(getCourtByIdStub.calledOnce).toBe(true);
    expect(updateStub.notCalled).toBe(true);
  });

  test('renders success page after a valid save', async () => {
    stub(CourtApi.prototype, 'getCourtById').resolves({ id: courtId, name: 'Reading Crown Court' } as never);
    stub(CourtApi.prototype, 'updateBuildingFacilities').resolves({
      id: 'fac-1',
      courtId,
      waitingArea: true,
      waitingAreaChildren: true,
      parking: true,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
      freeWaterDispensers: false,
      snackVendingMachines: false,
      drinkVendingMachines: false,
      cafeteria: true,
    } as never);

    const response = await request(app)
      .post(`/courts/${courtId}/edit/building-facilities/success`)
      .type('form')
      .send({
        parking: 'true',
        foodAndDrink: ['cafeteria'],
        waitingArea: 'true',
        waitingAreaChildren: 'true',
        quietRoom: 'false',
        babyChanging: 'false',
        wifi: 'true',
      });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Building Facilities details saved');
    expect(response.text).toContain('Reading Crown Court');
  });
});
