import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

describe('Cases heard page', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the cases heard page for a valid known court', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtAreasOfLaw').resolves([
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
          displayName: 'Probate',
          name: 'Probate',
          nameCy: 'Profiant',
        },
        selected: false,
      },
    ] as never);

    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Find a Court or Tribunal Admin');
    expect(response.text).toContain('Cases heard');
    expect(response.text).toContain('Select the types of cases heard at this court.');
    expect(response.text).toContain('If you have set up local authority config for Adoption, Children and/or Divorce');
    expect(response.text).toContain('Divorce');
    expect(response.text).toContain('Probate');
    expect(response.text).toContain(
      '<form method="post" action="/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard">'
    );
  });

  test('renders the dedicated court not found page for an invalid UUID', async () => {
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');
    const getCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'getCourtAreasOfLaw');

    const response = await request(app).get('/courts/not-a-uuid/edit/cases-heard');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(response.text).toContain('This court does not exist.');
    expect(getCourtByIdStub.notCalled).toBe(true);
    expect(getCourtAreasOfLawStub.notCalled).toBe(true);
  });

  test('renders the dedicated court not found page for a missing court', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);
    const getCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'getCourtAreasOfLaw');

    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(response.text).toContain('Return to the home page to view another court');
    expect(getCourtAreasOfLawStub.notCalled).toBe(true);
  });

  test('renders the generic error page when the court lookup fails', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves(HttpStatusCode.InternalServerError);
    const getCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'getCourtAreasOfLaw');

    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard');

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
    expect(getCourtAreasOfLawStub.notCalled).toBe(true);
  });

  test('renders the generic error page when the areas of law lookup fails', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtAreasOfLaw').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).get('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard');

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });

  test('updates the selected areas of law and redirects back to the page', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    const updateCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'updateCourtAreasOfLaw').resolves(
      HttpStatusCode.Ok
    );

    const response = await request(app)
      .post('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard')
      .type('form')
      .send('areasOfLaw=22222222-2222-4222-8222-222222222222&areasOfLaw=33333333-3333-4333-8333-333333333333');

    expect(response.status).toBe(HttpStatusCode.Found);
    expect(response.headers.location).toBe('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard');
    expect(updateCourtAreasOfLawStub.calledOnce).toBe(true);
    expect(updateCourtAreasOfLawStub.firstCall.args[0]).toEqual({
      areasOfLaw: ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'],
      courtId: '11111111-1111-4111-8111-111111111111',
    });
  });

  test('renders a validation error when no areas of law are selected', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getCourtAreasOfLaw').resolves([
      {
        areaOfLawType: {
          id: '22222222-2222-4222-8222-222222222222',
          name: 'Divorce',
          nameCy: 'Ysgariad',
        },
        selected: true,
      },
    ] as never);
    const updateCourtAreasOfLawStub = stub(DataApiRequests.prototype, 'updateCourtAreasOfLaw');

    const response = await request(app)
      .post('/courts/11111111-1111-4111-8111-111111111111/edit/cases-heard')
      .type('form')
      .send('');

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Select at least 1 type of case heard at this court.');
    expect(updateCourtAreasOfLawStub.notCalled).toBe(true);
  });
});
