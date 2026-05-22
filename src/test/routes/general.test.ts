import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

const COURT_ID = '11111111-1111-4111-8111-111111111111';

describe('General page', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the general edit page for a valid known court', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
      open: true,
      regionId: '22222222-2222-4222-8222-222222222222',
    } as never);
    stub(DataApiRequests.prototype, 'getRegions').resolves([
      { id: '22222222-2222-4222-8222-222222222222', name: 'South East' },
      { id: '33333333-3333-4333-8333-333333333333', name: 'North West' },
    ] as never);

    const response = await request(app).get(`/courts/${COURT_ID}/edit/general`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('General - Reading Crown Court');
    expect(response.text).toContain('Name');
    expect(response.text).toContain('Court status');
    expect(response.text).toContain('Choose whether the court is open or closed.');
    expect(response.text).toContain('Region');
    expect(response.text).toContain('South East');
    expect(response.text).toContain('North West');
    expect(response.text).toContain(
      `<form method="post" action="/courts/${COURT_ID}/edit/general/success">`
    );
  });

  test('renders the dedicated court not found page for an invalid UUID on GET', async () => {
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');
    const getRegionsStub = stub(DataApiRequests.prototype, 'getRegions');

    const response = await request(app).get('/courts/not-a-uuid/edit/general');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(response.text).toContain('This court does not exist.');
    expect(getCourtByIdStub.notCalled).toBe(true);
    expect(getRegionsStub.notCalled).toBe(true);
  });

  test('renders the dedicated court not found page for a missing court on GET', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);
    const getRegionsStub = stub(DataApiRequests.prototype, 'getRegions');

    const response = await request(app).get(`/courts/${COURT_ID}/edit/general`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(response.text).toContain('Return to the home page to view another court');
    expect(getRegionsStub.notCalled).toBe(true);
  });

  test('renders the generic error page when the court lookup fails on GET', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.InternalServerError);
    const getRegionsStub = stub(DataApiRequests.prototype, 'getRegions');

    const response = await request(app).get(`/courts/${COURT_ID}/edit/general`);

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
    expect(getRegionsStub.notCalled).toBe(true);
  });

  test('renders the generic error page when the regions lookup fails on GET', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
      open: true,
      regionId: '22222222-2222-4222-8222-222222222222',
    } as never);
    stub(DataApiRequests.prototype, 'getRegions').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).get(`/courts/${COURT_ID}/edit/general`);

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });

  test('updates the court details and renders the success page', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
      open: true,
      regionId: '22222222-2222-4222-8222-222222222222',
    } as never);
    stub(DataApiRequests.prototype, 'getRegions').resolves([
      { id: '22222222-2222-4222-8222-222222222222', name: 'South East' },
    ] as never);
    const updateCourtStub = stub(DataApiRequests.prototype, 'updateCourt').resolves({
      id: COURT_ID,
      name: 'Updated Reading Crown Court',
    } as never);

    const response = await request(app)
      .post(`/courts/${COURT_ID}/edit/general/success`)
      .type('form')
      .send('name=Updated%20Reading%20Crown%20Court&open=true&regionId=22222222-2222-4222-8222-222222222222');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('General details saved');
    expect(response.text).toContain('General details for Updated Reading Crown Court have been saved successfully.');
    expect(response.text).toContain('Continue updating Updated Reading Crown Court');
    expect(updateCourtStub.calledOnce).toBe(true);
    expect(updateCourtStub.firstCall.args[0]).toMatchObject({
      id: COURT_ID,
      name: 'Updated Reading Crown Court',
      regionId: '22222222-2222-4222-8222-222222222222',
    });
  });

  test('renders validation errors and error page title when name is missing on POST', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
      open: true,
      regionId: '22222222-2222-4222-8222-222222222222',
    } as never);
    stub(DataApiRequests.prototype, 'getRegions').resolves([
      { id: '22222222-2222-4222-8222-222222222222', name: 'South East' },
    ] as never);
    const updateCourtStub = stub(DataApiRequests.prototype, 'updateCourt');

    const response = await request(app)
      .post(`/courts/${COURT_ID}/edit/general/success`)
      .type('form')
      .send('open=true&regionId=22222222-2222-4222-8222-222222222222');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Enter a name for the court');
    expect(response.text).toContain('Error: General - Reading Crown Court');
    expect(updateCourtStub.notCalled).toBe(true);
  });

  test('renders the dedicated court not found page for an invalid UUID on POST', async () => {
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');
    const getRegionsStub = stub(DataApiRequests.prototype, 'getRegions');
    const updateCourtStub = stub(DataApiRequests.prototype, 'updateCourt');

    const response = await request(app).post('/courts/not-a-uuid/edit/general/success').type('form').send('name=Test');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getCourtByIdStub.notCalled).toBe(true);
    expect(getRegionsStub.notCalled).toBe(true);
    expect(updateCourtStub.notCalled).toBe(true);
  });

  test('renders the dedicated court not found page when the court is missing on POST', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);
    const getRegionsStub = stub(DataApiRequests.prototype, 'getRegions');
    const updateCourtStub = stub(DataApiRequests.prototype, 'updateCourt');

    const response = await request(app)
      .post(`/courts/${COURT_ID}/edit/general/success`)
      .type('form')
      .send('name=Updated%20Reading%20Crown%20Court&open=true&regionId=22222222-2222-4222-8222-222222222222');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getRegionsStub.notCalled).toBe(true);
    expect(updateCourtStub.notCalled).toBe(true);
  });

  test('renders the generic error page when save fails on POST', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: COURT_ID,
      name: 'Reading Crown Court',
      open: true,
      regionId: '22222222-2222-4222-8222-222222222222',
    } as never);
    stub(DataApiRequests.prototype, 'getRegions').resolves([
      { id: '22222222-2222-4222-8222-222222222222', name: 'South East' },
    ] as never);
    stub(DataApiRequests.prototype, 'updateCourt').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app)
      .post(`/courts/${COURT_ID}/edit/general/success`)
      .type('form')
      .send('name=Updated%20Reading%20Crown%20Court&open=true&regionId=22222222-2222-4222-8222-222222222222');

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });

  test('does not render the success page for GET requests', async () => {
    const response = await request(app).get(`/courts/${COURT_ID}/edit/general/success`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).not.toContain('General details saved');
  });
});

