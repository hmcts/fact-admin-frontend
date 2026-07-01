import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { CourtOpeningHoursService } from '../../main/services/CourtOpeningHoursService';

describe('Court opening hours routes', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const openingHoursId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    restore();
  });

  test('renders the court opening hours list', async () => {
    stub(CourtOpeningHoursService.prototype, 'getListPage').resolves({
      courtId,
      courtName: 'Reading Crown Court',
      pageTitle: 'Court opening hours - Reading Crown Court',
      openingHours: [
        {
          id: openingHoursId,
          openingHourType: 'Court open',
          hours: 'Monday to Friday: 09:00 to 17:00',
        },
      ],
    });

    const response = await request(app).get(`/courts/${courtId}/edit/court-opening-hours`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Find a Court or Tribunal Admin');
    expect(response.text).toContain('Court opening hours');
    expect(response.text).toContain('Opening hours type');
    expect(response.text).toContain('Hours');
    expect(response.text).toContain('Actions');
    expect(response.text).toContain('Edit');
    expect(response.text).toContain('Delete');
    expect(response.text).toContain('Add opening hours');
    expect(response.text).toContain('aria-label="Breadcrumb"');
    expect(response.text).toContain('<a class="govuk-breadcrumbs__link" href="/">Home</a>');
    expect(response.text).toContain(
      `<a class="govuk-breadcrumbs__link" href="/courts/${courtId}/edit">Reading Crown Court</a>`
    );
  });

  test('renders the edit opening hours form', async () => {
    stub(CourtOpeningHoursService.prototype, 'getEditPage').resolves({
      courtId,
      courtName: 'Reading Crown Court',
      days: [{ idPrefix: 'monday', name: 'Monday', value: 'MONDAY' }],
      errors: {},
      errorSummary: [],
      form: { selectedDays: [], sameTime: undefined },
      openingHourTypes: [{ id: '33333333-3333-4333-8333-333333333333', name: 'Court open', nameCy: null }],
      pageTitle: 'Edit opening hours - Reading Crown Court',
    });

    const response = await request(app).get(`/courts/${courtId}/edit/court-opening-hours/add`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Edit opening hours');
    expect(response.text).toContain('Select type');
    expect(response.text).toContain('Select an opening hours type');
    expect(response.text).not.toContain('--Select--');
    expect(response.text).toContain('Court open');
    expect(response.text).not.toContain('No counter service available');
    expect(response.text).toContain('Does the court open and close at the same time Monday to Friday?');
    expect(response.text).toContain('id="sameTimeYes"');
    expect(response.text).toContain('id="sameTimeNo"');
  });

  test('renders validation errors with links to specific fields', async () => {
    stub(CourtOpeningHoursService.prototype, 'save').resolves({
      type: 'validation_error',
      viewModel: {
        courtId,
        courtName: 'Reading Crown Court',
        days: [{ idPrefix: 'monday', name: 'Monday', value: 'MONDAY' }],
        errors: {
          openingHourTypeId: 'Select an opening hours type',
          sameOpeningHour: 'Opening hour must be between 0 and 23',
          sameOpeningMinute: 'Opening minute must be between 0 and 59',
        },
        errorSummary: [
          { href: '#openingHourTypeId', text: 'Select an opening hours type' },
          { href: '#sameOpeningHour', text: 'Opening hour must be between 0 and 23' },
          { href: '#sameOpeningMinute', text: 'Opening minute must be between 0 and 59' },
        ],
        form: { selectedDays: [], sameTime: 'yes' },
        openingHourTypes: [{ id: '33333333-3333-4333-8333-333333333333', name: 'Court open', nameCy: null }],
        pageTitle: 'Error: Edit opening hours - Reading Crown Court',
      },
    });

    const response = await request(app).post(`/courts/${courtId}/edit/court-opening-hours/save`).send({});

    expect(response.status).toBe(HttpStatusCode.BadRequest);
    expect(response.text).toContain('There is a problem');
    expect(response.text).toContain('href="#openingHourTypeId"');
    expect(response.text).toContain('href="#sameOpeningHour"');
    expect(response.text).toContain('href="#sameOpeningMinute"');
    expect(response.text).toContain('Opening hour must be between 0 and 23');
    expect(response.text).toContain('Opening minute must be between 0 and 59');
  });

  test('renders the save success page', async () => {
    stub(CourtOpeningHoursService.prototype, 'save').resolves({
      type: 'success',
      viewModel: {
        courtId,
        courtName: 'Reading Crown Court',
        openingHourType: 'Family Court open',
      },
    });

    const response = await request(app).post(`/courts/${courtId}/edit/court-opening-hours/save`).send({
      openingHourTypeId: '33333333-3333-4333-8333-333333333333',
      sameTime: 'yes',
      sameOpeningHour: '9',
      sameOpeningMinute: '00',
      sameClosingHour: '17',
      sameClosingMinute: '00',
    });

    expect(response.status).toBe(200);
    expect(response.text).toContain('Opening hours saved');
    expect(response.text).toContain('Opening hours for Reading Crown Court have been successfully updated.');
    expect(response.text).not.toContain('Opening hours saved Family Court open.');
    expect(response.text).toContain('Back to opening hours');
  });

  test('renders the delete confirmation page', async () => {
    stub(CourtOpeningHoursService.prototype, 'getDeletePage').resolves({
      courtId,
      courtName: 'Reading Crown Court',
      hours: 'Monday to Friday: 09:00 to 17:00',
      openingHoursId,
      openingHourType: 'Court open',
      pageTitle: 'Delete opening hours - Reading Crown Court',
    });

    const response = await request(app).get(`/courts/${courtId}/edit/court-opening-hours/delete/${openingHoursId}`);

    expect(response.status).toBe(200);
    expect(response.text).toContain('Are you sure you want to delete these opening hours?');
    expect(response.text).toContain('Reading Crown Court');
    expect(response.text).toContain('Court open');
    expect(response.text).toContain('Delete opening hours');
  });

  test('renders generic not found when an opening hours record no longer exists', async () => {
    stub(CourtOpeningHoursService.prototype, 'getDeletePage').resolves(HttpStatusCode.NotFound);

    const response = await request(app).get(`/courts/${courtId}/edit/court-opening-hours/delete/${openingHoursId}`);

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Page Not Found');
    expect(response.text).not.toContain('This court does not exist.');
  });

  test('renders the delete success page', async () => {
    stub(CourtOpeningHoursService.prototype, 'delete').resolves({
      courtId,
      courtName: 'Reading Crown Court',
      openingHourType: 'Court open',
    });

    const response = await request(app).post(
      `/courts/${courtId}/edit/court-opening-hours/delete/success/${openingHoursId}`
    );

    expect(response.status).toBe(200);
    expect(response.text).toContain('Opening hours deleted: Court open.');
    expect(response.text).toContain('You have removed this opening hour for Reading Crown Court.');
    expect(response.text).toContain('Back to opening hours');
  });

  test('renders court not found for invalid court UUID', async () => {
    const getListPage = stub(CourtOpeningHoursService.prototype, 'getListPage');

    const response = await request(app).get('/courts/not-a-uuid/edit/court-opening-hours');

    expect(response.status).toBe(HttpStatusCode.NotFound);
    expect(response.text).toContain('Court not found');
    expect(getListPage.notCalled).toBe(true);
  });
});
