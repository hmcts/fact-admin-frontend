import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { LocalAuthoritiesService } from '../../main/services/LocalAuthoritiesService';

describe('Local authorities routes', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const adoptionAreaOfLawId = '22222222-2222-4222-8222-222222222222';
  const childrenAreaOfLawId = '33333333-3333-4333-8333-333333333333';
  const divorceAreaOfLawId = '44444444-4444-4444-8444-444444444444';
  const localAuthorityOneId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const localAuthorityTwoId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const localAuthorityThreeId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  beforeEach(() => {
    restore();
  });

  test('renders local authorities page for a valid known court', async () => {
    stub(LocalAuthoritiesService.prototype, 'retrieve').resolves({
      courtId,
      courtTypes: {
        family: true,
      },
      casesHeard: {
        Adoption: true,
        Children: true,
        Divorce: false,
      },
      localAuthoritySelections: {
        Adoption: {
          areaOfLawId: adoptionAreaOfLawId,
          localAuthorities: [
            {
              id: localAuthorityOneId,
              name: 'Reading Borough Council',
              selected: true,
            },
          ],
        },
        Children: {
          areaOfLawId: childrenAreaOfLawId,
          localAuthorities: [
            {
              id: localAuthorityTwoId,
              name: 'Wokingham Borough Council',
              selected: false,
            },
          ],
        },
      },
    } as never);

    const response = await request(app).get(`/courts/${courtId}/edit/local-authorities`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Local Authorities');
    expect(response.text).toContain('If you set a local authority for a court');
    expect(response.text).toContain('Reading Borough Council');
    expect(response.text).toContain('Wokingham Borough Council');
    expect(response.text).toContain(`<form method="post" action="/courts/${courtId}/edit/local-authorities/success">`);
  });

  test('renders the dedicated court not found page for an invalid UUID', async () => {
    const retrieveStub = stub(LocalAuthoritiesService.prototype, 'retrieve');

    const response = await request(app).get('/courts/not-a-uuid/edit/local-authorities');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(response.text).toContain('This court does not exist.');
    expect(retrieveStub.notCalled).toBe(true);
  });

  test('renders the dedicated court not found page when the court is missing', async () => {
    stub(LocalAuthoritiesService.prototype, 'retrieve').resolves(HttpStatusCode.NotFound);

    const response = await request(app).get(`/courts/${courtId}/edit/local-authorities`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(response.text).toContain('Return to the home page to view another court');
  });

  test('renders the generic error page when retrieval fails', async () => {
    stub(LocalAuthoritiesService.prototype, 'retrieve').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).get(`/courts/${courtId}/edit/local-authorities`);

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });

  test('updates selected local authorities and renders success page', async () => {
    const updateStub = stub(LocalAuthoritiesService.prototype, 'update').resolves({
      status: 'saved',
      courtName: 'Reading Crown Court',
    } as never);

    const response = await request(app)
      .post(`/courts/${courtId}/edit/local-authorities/success`)
      .type('form')
      .send(
        `Adoption.${adoptionAreaOfLawId}=&Adoption.${adoptionAreaOfLawId}=${localAuthorityOneId}` +
          `&Children.${childrenAreaOfLawId}=not-a-uuid&Children.${childrenAreaOfLawId}=${localAuthorityTwoId}` +
          `&Children.${childrenAreaOfLawId}=${localAuthorityThreeId}&Divorce.${divorceAreaOfLawId}=`
      );

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('have been successfully updated');
    expect(response.text).toContain('Continue updating Reading Crown Court');
    expect(updateStub.calledOnce).toBe(true);
    expect(updateStub.firstCall.args[0]).toBe(courtId);
    expect(updateStub.firstCall.args[1]).toEqual({
      Adoption: {
        areaOfLawId: adoptionAreaOfLawId,
        localAuthorities: [{ id: localAuthorityOneId, selected: true }],
      },
      Children: {
        areaOfLawId: childrenAreaOfLawId,
        localAuthorities: [
          { id: localAuthorityTwoId, selected: true },
          { id: localAuthorityThreeId, selected: true },
        ],
      },
      Divorce: {
        areaOfLawId: divorceAreaOfLawId,
        localAuthorities: [],
      },
    });
  });

  test('does not render success page for GET requests', async () => {
    const response = await request(app).get(`/courts/${courtId}/edit/local-authorities/success`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).not.toContain('have been successfully updated');
  });

  test('renders the dedicated court not found page for invalid UUID on update route', async () => {
    const updateStub = stub(LocalAuthoritiesService.prototype, 'update');

    const response = await request(app)
      .post('/courts/not-a-uuid/edit/local-authorities/success')
      .type('form')
      .send(`Adoption.${adoptionAreaOfLawId}=${localAuthorityOneId}`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(updateStub.notCalled).toBe(true);
  });

  test('renders the generic error page when update fails', async () => {
    stub(LocalAuthoritiesService.prototype, 'update').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app)
      .post(`/courts/${courtId}/edit/local-authorities/success`)
      .type('form')
      .send(`Adoption.${adoptionAreaOfLawId}=${localAuthorityOneId}`);

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });

  test('renders the generic error page when update returns validation errors', async () => {
    stub(LocalAuthoritiesService.prototype, 'update').resolves({
      status: 'invalid',
      courtName: 'Reading Crown Court',
      errors: {
        Adoption: ['Invalid local authority for adoption'],
      },
    } as never);

    const response = await request(app)
      .post(`/courts/${courtId}/edit/local-authorities/success`)
      .type('form')
      .send(`Adoption.${adoptionAreaOfLawId}=${localAuthorityOneId}`);

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('Something went wrong');
  });
});
