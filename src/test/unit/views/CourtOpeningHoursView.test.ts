import { env } from '../../../testUtils/nunjucksHelper';

describe('Court Opening Hours View', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  test('renders list page with edit controls for admin users', () => {
    const html = env.render('court-opening-hours.njk', {
      courtId,
      openingHours: [
        {
          hours: 'Monday to Friday 9am to 5pm',
          id: 'opening-hours-id',
          openingHourType: 'Court open',
        },
      ],
      pagePath: `/courts/${courtId}/edit/court-opening-hours`,
      pageTitle: 'Court opening hours',
    });

    expect(html).toContain('Court opening hours');
    expect(html).toContain('Edit');
    expect(html).toContain('Delete');
    expect(html).toContain('Add opening hours');
    expect(html).toContain(`/courts/${courtId}/edit/court-opening-hours/add`);
    expect(html).toContain(`/courts/${courtId}/edit/court-opening-hours/edit/opening-hours-id`);
    expect(html).toContain(`/courts/${courtId}/edit/court-opening-hours/delete/opening-hours-id`);
  });

  test('renders list page as view-only for viewer users', () => {
    const html = env.render('court-opening-hours.njk', {
      courtId,
      isViewer: true,
      openingHours: [
        {
          hours: 'Monday to Friday 9am to 5pm',
          id: 'opening-hours-id',
          openingHourType: 'Court open',
        },
      ],
      pagePath: `/courts/${courtId}/edit/court-opening-hours`,
      pageTitle: 'Court opening hours',
    });

    expect(html).toContain('View');
    expect(html).not.toContain('Delete');
    expect(html).not.toContain('Add opening hours');
  });

  test('renders edit page with save button and save action for admin users', () => {
    const html = env.render('court-opening-hours-edit.njk', {
      courtId,
      days: [
        { idPrefix: 'monday', name: 'Monday', value: 'MONDAY' },
        { idPrefix: 'tuesday', name: 'Tuesday', value: 'TUESDAY' },
      ],
      errorSummary: [],
      errors: {},
      form: {
        openingHourTypeId: 'type-id',
        sameClosingHour: '17',
        sameClosingMinute: '00',
        sameOpeningHour: '09',
        sameOpeningMinute: '00',
        sameTime: 'yes',
      },
      openingHoursId: 'opening-hours-id',
      openingHourTypes: [{ id: 'type-id', name: 'Court open' }],
      pagePath: `/courts/${courtId}/edit/court-opening-hours/edit/opening-hours-id`,
      pageTitle: 'Court opening hours',
    });

    expect(html).toContain('Court opening hours');
    expect(html).toContain('Edit opening hours');
    expect(html).toContain(`action="/courts/${courtId}/edit/court-opening-hours/save/opening-hours-id"`);
    expect(html).toContain('class="govuk-button"');
    expect(html).toContain('Save');
    expect(html).toContain('Select type');
    expect(html).toContain('Does the court open and close at the same time Monday to Friday?');
  });

  test('renders edit page as view-only for viewer users', () => {
    const html = env.render('court-opening-hours-edit.njk', {
      courtId,
      days: [],
      errorSummary: [],
      errors: {},
      form: {
        openingHourTypeId: 'type-id',
        sameTime: 'yes',
      },
      isViewer: true,
      openingHoursId: 'opening-hours-id',
      openingHourTypes: [{ id: 'type-id', name: 'Court open' }],
      pagePath: `/courts/${courtId}/edit/court-opening-hours/edit/opening-hours-id`,
      pageTitle: 'Court opening hours',
    });

    expect(html).toContain('View opening hours');
    expect(html).toContain('<fieldset class="govuk-fieldset" disabled>');
    expect(html).not.toContain('class="govuk-button"');
  });

  test('renders validation summary and field messages on edit page', () => {
    const html = env.render('court-opening-hours-edit.njk', {
      courtId,
      days: [],
      errorSummary: [
        { href: '#openingHourTypeId', text: 'Select opening hours type' },
        { href: '#sameTimeYes', text: 'Select yes if same opening hours apply Monday to Friday' },
      ],
      errors: {
        openingHourTypeId: 'Select opening hours type',
        sameTimeYes: 'Select yes if same opening hours apply Monday to Friday',
      },
      form: {},
      openingHourTypes: [{ id: 'type-id', name: 'Court open' }],
      pagePath: `/courts/${courtId}/edit/court-opening-hours/add`,
      pageTitle: 'Court opening hours',
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Select opening hours type');
    expect(html).toContain('Select yes if same opening hours apply Monday to Friday');
  });
});
