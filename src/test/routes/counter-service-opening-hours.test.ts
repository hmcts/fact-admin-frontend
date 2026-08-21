import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { CounterServiceOpeningHoursService } from '../../main/services/CounterServiceOpeningHoursService';

describe('Counter service opening hours routes', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const counterServiceId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    restore();
  });

  test('renders the counter service opening hours list', async () => {
    stub(CounterServiceOpeningHoursService.prototype, 'getListPage').resolves({
      courtId,
      courtName: 'Newcastle Crown Court',
      counterServiceOpeningHours: [
        {
          id: counterServiceId,
          assistanceAvailable: 'Forms',
          appointmentNeeded: 'No',
          hours: 'Monday to Friday: 09:00 to 17:00',
        },
      ],
      pageTitle: 'Counter service opening hours - Newcastle Crown Court',
    });

    const response = await request(app).get(`/courts/${courtId}/edit/counter-service-opening-hours`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Counter service opening hours');
    expect(response.text).toContain('Assistance available');
    expect(response.text).toContain('Is an appointment needed?');
    expect(response.text).toContain('Hours');
    expect(response.text).toContain('Actions');
    expect(response.text).toContain('Edit');
    expect(response.text).toContain('Delete');
    expect(response.text).toContain('Add opening hours');
    expect(response.text).toContain('aria-label="Breadcrumb"');
    expect(response.text).toContain('<a class="govuk-breadcrumbs__link" href="/">Home</a>');
    expect(response.text).toContain(
      `<a class="govuk-breadcrumbs__link" href="/courts/${courtId}/edit">Edit Newcastle Crown Court</a>`
    );
  });

  test('renders the edit counter service opening hours form', async () => {
    stub(CounterServiceOpeningHoursService.prototype, 'getEditPage').resolves({
      courtId,
      courtName: 'Newcastle Crown Court',
      counterServiceId,
      days: [{ idPrefix: 'monday', name: 'Monday', value: 'MONDAY' }],
      errors: {},
      errorSummary: [],
      form: { assistWith: [], selectedDays: [], sameTime: undefined },
      pageTitle: 'Edit counter service opening hours - Newcastle Crown Court',
    });

    const response = await request(app).get(`/courts/${courtId}/edit/counter-service-opening-hours/add`);

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Edit counter service opening hours');
    expect(response.text).toContain('Select what the counter can assist with?');
    expect(response.text).toContain('Is an appointment needed?');
    expect(response.text).toContain('Does the counter open and close at the same time Monday to Friday?');
    expect(response.text).toContain('id="sameTimeYes"');
    expect(response.text).toContain('id="sameTimeNo"');
  });

  test('renders validation errors with links to specific fields', async () => {
    stub(CounterServiceOpeningHoursService.prototype, 'save').resolves({
      type: 'validation_error',
      viewModel: {
        courtId,
        courtName: 'Newcastle Crown Court',
        days: [{ idPrefix: 'monday', name: 'Monday', value: 'MONDAY' }],
        errors: {
          assistWith: 'Select what the counter can assist with',
          sameOpeningHour: 'Opening hour must be between 0 and 23',
          sameOpeningMinute: 'Opening minute must be between 0 and 59',
        },
        errorSummary: [
          { href: '#assistWith', text: 'Select what the counter can assist with' },
          { href: '#sameOpeningHour', text: 'Opening hour must be between 0 and 23' },
          { href: '#sameOpeningMinute', text: 'Opening minute must be between 0 and 59' },
        ],
        form: { assistWith: [], selectedDays: [], sameTime: 'yes' },
        pageTitle: 'Error: Edit counter service opening hours - Newcastle Crown Court',
      },
    });

    const response = await request(app).post(`/courts/${courtId}/edit/counter-service-opening-hours/save`).send({});

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('href="#assistWith"');
    expect(response.text).toContain('href="#sameOpeningHour"');
    expect(response.text).toContain('href="#sameOpeningMinute"');
    expect(response.text).toContain('Opening hour must be between 0 and 23');
    expect(response.text).toContain('Opening minute must be between 0 and 59');
  });

  test('renders the save success page', async () => {
    stub(CounterServiceOpeningHoursService.prototype, 'save').resolves({
      type: 'success',
      viewModel: {
        courtId,
        courtName: 'Newcastle Crown Court',
        assistanceAvailable: 'Forms',
      },
    });

    const response = await request(app)
      .post(`/courts/${courtId}/edit/counter-service-opening-hours/save`)
      .send({
        assistWith: ['forms'],
        appointmentNeeded: 'no',
        sameTime: 'yes',
        sameOpeningHour: '9',
        sameOpeningMinute: '00',
        sameClosingHour: '17',
        sameClosingMinute: '00',
      });

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Counter service opening hours saved');
    expect(response.text).toContain(
      'Counter service opening hours for Newcastle Crown Court have been successfully updated.'
    );
    expect(response.text).toContain(
      `<a href="/courts/${courtId}/edit/counter-service-opening-hours" class="govuk-link govuk-link--no-visited-state">Back to Counter service opening hours</a>`
    );
  });

  test('renders the delete confirmation page', async () => {
    stub(CounterServiceOpeningHoursService.prototype, 'getDeletePage').resolves({
      courtId,
      courtName: 'Newcastle Crown Court',
      assistanceAvailable: 'Forms',
      hours: 'Monday to Friday: 09:00 to 17:00',
      counterServiceId,
      pageTitle: 'Delete opening hours - Newcastle Crown Court',
    });

    const response = await request(app).get(
      `/courts/${courtId}/edit/counter-service-opening-hours/delete/${counterServiceId}`
    );

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Are you sure you want to delete these opening hours?');
    expect(response.text).toContain('Newcastle Crown Court');
    expect(response.text).toContain('Forms');
    expect(response.text).toContain('Delete opening hours');
  });

  test('renders generic not found when a counter service opening hours record no longer exists', async () => {
    stub(CounterServiceOpeningHoursService.prototype, 'getDeletePage').resolves(HttpStatusCode.NotFound);

    const response = await request(app).get(
      `/courts/${courtId}/edit/counter-service-opening-hours/delete/${counterServiceId}`
    );

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Page Not Found');
    expect(response.text).not.toContain('This court does not exist.');
  });

  test('renders the delete success page', async () => {
    stub(CounterServiceOpeningHoursService.prototype, 'delete').resolves({
      courtId,
      courtName: 'Newcastle Crown Court',
      assistanceAvailable: 'Forms',
    });

    const response = await request(app).post(
      `/courts/${courtId}/edit/counter-service-opening-hours/delete/success/${counterServiceId}`
    );

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Opening hours deleted Forms.');
    expect(response.text).toContain('You have removed this counter service opening hour for Newcastle Crown Court.');
    expect(response.text).toContain('Back to Counter service opening hours');
  });
});
