import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';

const courtId = '11111111-1111-4111-8111-111111111111';

describe('Translation and interpretation page', () => {
  beforeEach(() => {
    restore();
  });

  test('renders unchecked options when no translation services exist', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getTranslationServices').resolves(null);

    const response = await request(app).get(`/courts/${courtId}/edit/translation-and-interpretation`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Translation and interpretation');
    expect(response.text).toContain('Select all that apply');
    expect(response.text).not.toContain('checked');
  });

  test('renders checked options for non-empty translation service values', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getTranslationServices').resolves({
      courtId,
      email: 'translations@example.com',
      id: '22222222-2222-4222-8222-222222222222',
      phoneNumber: '+441234 567890',
    });

    const response = await request(app).get(`/courts/${courtId}/edit/translation-and-interpretation`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('value="translations@example.com"');
    expect(response.text).toContain('value="+441234 567890"');
    expect(response.text.match(/checked/g)).toHaveLength(2);
  });

  test('treats empty or null translation service values as unchecked', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getTranslationServices').resolves({
      courtId,
      email: null,
      id: '22222222-2222-4222-8222-222222222222',
      phoneNumber: '',
    });

    const response = await request(app).get(`/courts/${courtId}/edit/translation-and-interpretation`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).not.toContain('checked');
  });

  test('posts empty strings for unselected contact methods', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveStub = stub(DataApiRequests.prototype, 'saveTranslationServices').resolves(HttpStatusCode.NoContent);

    const response = await request(app).post(`/courts/${courtId}/edit/translation-and-interpretation/success`).send({});

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Translation and interpretation saved');
    expect(response.text).toContain(
      'Translation and interpretation contact for Reading Crown Court has been saved successfully.'
    );
    expect(response.text).toContain('Continue updating Reading Crown Court');
    expect(response.text).toContain('Home');
    expect(saveStub.calledWith(courtId, { courtId, email: '', phoneNumber: '' })).toBe(true);
  });

  test('posts only selected contact method values', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveStub = stub(DataApiRequests.prototype, 'saveTranslationServices').resolves(HttpStatusCode.NoContent);

    const response = await request(app)
      .post(`/courts/${courtId}/edit/translation-and-interpretation/success`)
      .type('form')
      .send({
        contactMethods: ['email'],
        email: 'translations@example.com',
        phoneNumber: '+441234 567890',
      });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Translation and interpretation saved');
    expect(saveStub.calledWith(courtId, { courtId, email: 'translations@example.com', phoneNumber: '' })).toBe(true);
  });

  test('renders validation errors for invalid selected values', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveStub = stub(DataApiRequests.prototype, 'saveTranslationServices');

    const response = await request(app)
      .post(`/courts/${courtId}/edit/translation-and-interpretation/success`)
      .type('form')
      .send({
        contactMethods: ['email', 'phoneNumber'],
        email: 'INVALID',
        phoneNumber: 'abc',
      });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('Enter an email address in the correct format');
    expect(response.text).toContain('Enter a telephone number in the correct format');
    expect(saveStub.notCalled).toBe(true);
  });

  test('renders validation errors for empty selected values', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveStub = stub(DataApiRequests.prototype, 'saveTranslationServices');

    const response = await request(app)
      .post(`/courts/${courtId}/edit/translation-and-interpretation/success`)
      .type('form')
      .send({
        contactMethods: ['email', 'phoneNumber'],
        email: '',
        phoneNumber: '',
      });

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('Enter an email address');
    expect(response.text).toContain('Enter a telephone number');
    expect(saveStub.notCalled).toBe(true);
  });

  test('renders court not found for invalid court id', async () => {
    const getCourtByIdStub = stub(DataApiRequests.prototype, 'getCourtById');

    const response = await request(app).get('/courts/not-a-uuid/edit/translation-and-interpretation');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getCourtByIdStub.notCalled).toBe(true);
  });

  test('does not render the success page for GET requests', async () => {
    const response = await request(app).get(`/courts/${courtId}/edit/translation-and-interpretation/success`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).not.toContain('Translation and interpretation saved');
  });

  test('does not save from the base page POST URL', async () => {
    const saveStub = stub(DataApiRequests.prototype, 'saveTranslationServices');

    const response = await request(app).post(`/courts/${courtId}/edit/translation-and-interpretation`).send({});

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(saveStub.notCalled).toBe(true);
  });
});
