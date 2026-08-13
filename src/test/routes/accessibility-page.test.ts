import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { CourtApi } from '../../main/requests/CourtApi';

describe('Accessibility page', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    restore();
  });

  test('renders the accessibility page for a valid known court with breadcrumbs', async () => {
    stub(CourtApi.prototype, 'getCourtById').resolves({ id: courtId, name: 'Reading Crown Court' } as never);
    stub(CourtApi.prototype, 'getAccessibility').resolves(null as never);

    const response = await request(app).get(`/courts/${courtId}/edit/accessibility`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Accessibility');
    expect(response.text).toContain('aria-label="Breadcrumb"');
    expect(response.text).toContain('<a class="govuk-breadcrumbs__link" href="/">Home</a>');
    expect(response.text).toContain(
      `<a class="govuk-breadcrumbs__link" href="/courts/${courtId}/edit">Edit Reading Crown Court</a>`
    );
  });

  test('renders court not found for invalid court id', async () => {
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById');

    const response = await request(app).get('/courts/not-a-uuid/edit/accessibility');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getCourtByIdStub.notCalled).toBe(true);
  });

  test('renders court not found when the court does not exist', async () => {
    stub(CourtApi.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);

    const response = await request(app).get(`/courts/${courtId}/edit/accessibility`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
  });

  test('renders generic error page when court lookup fails on GET', async () => {
    stub(CourtApi.prototype, 'getCourtById').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).get(`/courts/${courtId}/edit/accessibility`);

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });

  test('renders generic error page when accessibility lookup fails on GET', async () => {
    stub(CourtApi.prototype, 'getCourtById').resolves({ id: courtId, name: 'Reading Crown Court' } as never);
    stub(CourtApi.prototype, 'getAccessibility').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).get(`/courts/${courtId}/edit/accessibility`);

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });

  test('saves accessibility details and renders success page on valid POST', async () => {
    stub(CourtApi.prototype, 'getCourtById').resolves({ id: courtId, name: 'Reading Crown Court' } as never);
    const updateAccessibilityStub = stub(CourtApi.prototype, 'updateAccessibility').resolves({
      accessibleParking: true,
      accessibleToiletDescription: 'Accessible toilet available near reception',
      accessibleToiletDescriptionCy: 'Toiled hygyrch ger y dderbynfa',
      hearingEnhancementEquipment: 'NONE',
      lift: true,
      liftDoorLimit: 900,
      liftDoorWidth: 120,
      quietRoom: true,
    } as never);

    const response = await request(app).post(`/courts/${courtId}/edit/accessibility/success`).type('form').send({
      accessibleParking: 'true',
      accessibleToiletDescription: 'Accessible toilet available near reception',
      accessibleToiletDescriptionCy: 'Toiled hygyrch ger y dderbynfa',
      accessibleEntrance: 'true',
      hearingEnhancementEquipment: 'none',
      lift: 'true',
      liftDoorWidth: '120',
      liftDoorLimit: '900',
      quietRoom: 'true',
    });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Accessibility details saved');
    expect(response.text).toContain('Accessibility details saved for Reading Crown Court');
    expect(response.text).toContain(
      `<a href="/courts/${courtId}/edit" class="govuk-link govuk-link--no-visited-state">`
    );
    expect(updateAccessibilityStub.calledOnce).toBe(true);
    expect(updateAccessibilityStub.firstCall.args[1]).toEqual(
      expect.objectContaining({ hearingEnhancementEquipment: 'NONE' })
    );
  });

  test('renders validation errors on invalid POST payload', async () => {
    stub(CourtApi.prototype, 'getCourtById').resolves({ id: courtId, name: 'Reading Crown Court' } as never);
    const updateAccessibilityStub = stub(CourtApi.prototype, 'updateAccessibility');

    const response = await request(app).post(`/courts/${courtId}/edit/accessibility/success`).type('form').send({
      accessibleParking: 'true',
      accessibleToiletDescription: '',
      accessibleEntrance: 'true',
      hearingEnhancementEquipment: 'infraredAndHearingLoop',
      lift: 'true',
      liftDoorWidth: '',
      liftDoorLimit: '',
      quietRoom: 'true',
    });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('Enter the lift door width');
    expect(response.text).toContain('Enter the lift weight limit');
    expect(response.text).toContain('Enter a description of the accessible toilet facilities');
    expect(updateAccessibilityStub.notCalled).toBe(true);
  });

  test('renders court not found for invalid court id on POST', async () => {
    const getCourtByIdStub = stub(CourtApi.prototype, 'getCourtById');

    const response = await request(app).post('/courts/not-a-uuid/edit/accessibility/success').type('form').send({});

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getCourtByIdStub.notCalled).toBe(true);
  });

  test('renders court not found when save cannot find the court on POST', async () => {
    stub(CourtApi.prototype, 'getCourtById').resolves(HttpStatusCode.NotFound);

    const response = await request(app).post(`/courts/${courtId}/edit/accessibility/success`).type('form').send({});

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
  });

  test('renders generic error page when save fails on POST', async () => {
    stub(CourtApi.prototype, 'getCourtById').resolves({ id: courtId, name: 'Reading Crown Court' } as never);
    stub(CourtApi.prototype, 'updateAccessibility').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).post(`/courts/${courtId}/edit/accessibility/success`).type('form').send({
      accessibleParking: 'true',
      accessibleToiletDescription: 'Accessible toilet available near reception',
      accessibleToiletDescriptionCy: 'Toiled hygyrch ger y dderbynfa',
      accessibleEntrance: 'true',
      hearingEnhancementEquipment: 'infraredAndHearingLoop',
      lift: 'true',
      liftDoorWidth: '120',
      liftDoorLimit: '900',
      quietRoom: 'true',
    });

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });

  test('does not render success page for direct GET requests', async () => {
    const response = await request(app).get(`/courts/${courtId}/edit/accessibility/success`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).not.toContain('Accessibility details saved');
  });
});
