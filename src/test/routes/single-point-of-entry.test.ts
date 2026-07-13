import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { SinglePointOfEntryService } from '../../main/services/SinglePointOfEntryService';

describe('Single point of entry routes', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    restore();
  });

  test('renders single point of entry page for a valid known court', async () => {
    stub(SinglePointOfEntryService.prototype, 'retrieve').resolves({
      courtId,
      courtName: 'Reading Crown Court',
      singlePointOfEntryServices: [
        {
          areaOfLawId: '22222222-2222-4222-8222-222222222222',
          label: 'Childcare arrangements',
          singlePointOfEntry: false,
        },
      ],
      pageTitle: 'Single points of entry - Reading Crown Court',
    });

    const response = await request(app).get(`/courts/${courtId}/edit/single-point-of-entry`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Single points of entry');
    expect(response.text).toContain('Select the services where this court is the single point of entry.');
    expect(response.text).toContain('Childcare arrangements');
    expect(response.text).toContain(
      `<form method="post" action="/courts/${courtId}/edit/single-point-of-entry/success">`
    );
    expect(response.text).toContain('aria-label="Breadcrumb"');
    expect(response.text).toContain('<a class="govuk-breadcrumbs__link" href="/">Home</a>');
    expect(response.text).toContain(
      `<a class="govuk-breadcrumbs__link" href="/courts/${courtId}/edit">Edit Reading Crown Court</a>`
    );
    expect(response.text).toContain(
      `<a class="govuk-breadcrumbs__link" href="/courts/${courtId}/edit/single-point-of-entry">Single points of entry</a>`
    );
    expect(response.text).toContain('type="checkbox" value="true"');
    expect(response.text).not.toContain('type="checkbox" value="true" checked');
  });

  test('renders the dedicated court not found page for an invalid UUID', async () => {
    const retrieveStub = stub(SinglePointOfEntryService.prototype, 'retrieve');

    const response = await request(app).get('/courts/not-a-uuid/edit/single-point-of-entry');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(retrieveStub.notCalled).toBe(true);
  });

  test('renders the generic error page when retrieval fails', async () => {
    stub(SinglePointOfEntryService.prototype, 'retrieve').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app).get(`/courts/${courtId}/edit/single-point-of-entry`);

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });

  test('updates single point of entry and renders success page', async () => {
    const updateStub = stub(SinglePointOfEntryService.prototype, 'update').resolves({
      status: 'saved',
      courtName: 'Reading Crown Court',
    });

    const response = await request(app)
      .post(`/courts/${courtId}/edit/single-point-of-entry/success`)
      .type('form')
      .send(
        'singlePointOfEntry.22222222-2222-4222-8222-222222222222=false&singlePointOfEntry.22222222-2222-4222-8222-222222222222=true'
      );

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('have been successfully updated');
    expect(response.text).toContain('Continue updating Reading Crown Court');
    expect(response.text).toContain('aria-label="Breadcrumb"');
    expect(response.text).toContain('<a class="govuk-breadcrumbs__link" href="#">Single points of entry saved</a>');
    expect(
      updateStub.calledOnceWith(courtId, {
        '22222222-2222-4222-8222-222222222222': true,
      })
    ).toBe(true);
  });

  test('updates service to false when no was selected', async () => {
    const updateStub = stub(SinglePointOfEntryService.prototype, 'update').resolves({
      status: 'saved',
      courtName: 'Reading Crown Court',
    });

    await request(app)
      .post(`/courts/${courtId}/edit/single-point-of-entry/success`)
      .type('form')
      .send('singlePointOfEntry.22222222-2222-4222-8222-222222222222=false');

    expect(
      updateStub.calledOnceWith(courtId, {
        '22222222-2222-4222-8222-222222222222': false,
      })
    ).toBe(true);
  });

  test('rejects invalid radio values before calling the service', async () => {
    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');

    const response = await request(app)
      .post(`/courts/${courtId}/edit/single-point-of-entry/success`)
      .type('form')
      .send(
        'singlePointOfEntry.22222222-2222-4222-8222-222222222222=false&singlePointOfEntry.22222222-2222-4222-8222-222222222222=maybe'
      );

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('Something went wrong');
    expect(updateStub.notCalled).toBe(true);
  });

  test('rejects unexpected checkbox value order before calling the service', async () => {
    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');

    const response = await request(app)
      .post(`/courts/${courtId}/edit/single-point-of-entry/success`)
      .type('form')
      .send(
        'singlePointOfEntry.22222222-2222-4222-8222-222222222222=true&singlePointOfEntry.22222222-2222-4222-8222-222222222222=false'
      );

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('Something went wrong');
    expect(updateStub.notCalled).toBe(true);
  });

  test('rejects repeated checkbox values before calling the service', async () => {
    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');

    const response = await request(app)
      .post(`/courts/${courtId}/edit/single-point-of-entry/success`)
      .type('form')
      .send(
        'singlePointOfEntry.22222222-2222-4222-8222-222222222222=false&singlePointOfEntry.22222222-2222-4222-8222-222222222222=false'
      );

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('Something went wrong');
    expect(updateStub.notCalled).toBe(true);
  });

  test('rejects invalid area of law ids before calling the service', async () => {
    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');

    const response = await request(app)
      .post(`/courts/${courtId}/edit/single-point-of-entry/success`)
      .type('form')
      .send('singlePointOfEntry.not-a-uuid=true');

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('Something went wrong');
    expect(updateStub.notCalled).toBe(true);
  });

  test('does not render success page for GET requests', async () => {
    const response = await request(app).get(`/courts/${courtId}/edit/single-point-of-entry/success`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).not.toContain('have been successfully updated');
  });

  test('renders the dedicated court not found page for invalid UUID on update route', async () => {
    const updateStub = stub(SinglePointOfEntryService.prototype, 'update');

    const response = await request(app)
      .post('/courts/not-a-uuid/edit/single-point-of-entry/success')
      .type('form')
      .send(
        'singlePointOfEntry.22222222-2222-4222-8222-222222222222=false&singlePointOfEntry.22222222-2222-4222-8222-222222222222=true'
      );

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(updateStub.notCalled).toBe(true);
  });

  test('renders the generic error page when update fails', async () => {
    stub(SinglePointOfEntryService.prototype, 'update').resolves(HttpStatusCode.InternalServerError);

    const response = await request(app)
      .post(`/courts/${courtId}/edit/single-point-of-entry/success`)
      .type('form')
      .send(
        'singlePointOfEntry.22222222-2222-4222-8222-222222222222=false&singlePointOfEntry.22222222-2222-4222-8222-222222222222=true'
      );

    expect(response.status).toBe(HttpStatusCode.InternalServerError);
    expect(response.text).toContain('Something went wrong');
  });
});
