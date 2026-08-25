import { env } from '../../../testUtils/nunjucksHelper';

describe('Counter Service Opening Hours View', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  test('renders list page with edit controls for admin users', () => {
    const html = env.render('counter-service-opening-hours.njk', {
      counterServiceOpeningHours: [
        {
          appointmentNeeded: 'No',
          assistanceAvailable: 'Forms',
          hours: 'Monday to Friday 9am to 5pm',
          id: 'counter-service-id',
        },
      ],
      courtId,
      pagePath: `/courts/${courtId}/edit/counter-service-opening-hours`,
      pageTitle: 'Counter service opening hours',
    });

    expect(html).toContain('Counter service opening hours');
    expect(html).toContain('Edit');
    expect(html).toContain('Delete');
    expect(html).toContain('Add opening hours');
    expect(html).toContain(`/courts/${courtId}/edit/counter-service-opening-hours/add`);
    expect(html).toContain(`/courts/${courtId}/edit/counter-service-opening-hours/edit/counter-service-id`);
    expect(html).toContain(`/courts/${courtId}/edit/counter-service-opening-hours/delete/counter-service-id`);
  });

  test('renders list page as view-only for viewer users', () => {
    const html = env.render('counter-service-opening-hours.njk', {
      counterServiceOpeningHours: [
        {
          appointmentNeeded: 'No',
          assistanceAvailable: 'Forms',
          hours: 'Monday to Friday 9am to 5pm',
          id: 'counter-service-id',
        },
      ],
      courtId,
      isViewer: true,
      pagePath: `/courts/${courtId}/edit/counter-service-opening-hours`,
      pageTitle: 'Counter service opening hours',
    });

    expect(html).toContain('View');
    expect(html).not.toContain('Delete');
    expect(html).not.toContain('Add opening hours');
  });

  test('renders edit page with save button and save action for admin users', () => {
    const html = env.render('counter-service-opening-hours-edit.njk', {
      counterServiceId: 'counter-service-id',
      courtId,
      days: [
        { idPrefix: 'monday', name: 'Monday', value: 'MONDAY' },
        { idPrefix: 'tuesday', name: 'Tuesday', value: 'TUESDAY' },
      ],
      errors: {},
      errorSummary: [],
      form: {
        appointmentContact: 'counter@example.test',
        appointmentNeeded: 'yes',
        assistWith: ['forms'],
        sameClosingHour: '17',
        sameClosingMinute: '00',
        sameOpeningHour: '09',
        sameOpeningMinute: '00',
        sameTime: 'yes',
      },
      pagePath: `/courts/${courtId}/edit/counter-service-opening-hours/edit/counter-service-id`,
      pageTitle: 'Counter service opening hours',
    });

    expect(html).toContain('Edit counter service opening hours');
    expect(html).toContain(`action="/courts/${courtId}/edit/counter-service-opening-hours/save/counter-service-id"`);
    expect(html).toContain('class="govuk-button"');
    expect(html).toContain('Save');
    expect(html).toContain('Select what the counter can assist with?');
    expect(html).toContain('Is an appointment needed?');
    expect(html).toContain('Does the counter open and close at the same time Monday to Friday?');
  });

  test('renders edit page as view-only for viewer users', () => {
    const html = env.render('counter-service-opening-hours-edit.njk', {
      counterServiceId: 'counter-service-id',
      courtId,
      days: [],
      errors: {},
      errorSummary: [],
      form: {
        appointmentNeeded: 'no',
        assistWith: ['forms'],
        sameTime: 'yes',
        selectedDays: [],
      },
      isViewer: true,
      pagePath: `/courts/${courtId}/edit/counter-service-opening-hours/edit/counter-service-id`,
      pageTitle: 'Counter service opening hours',
    });

    expect(html).toContain('View counter service opening hours');
    expect(html).toContain('<fieldset class="govuk-fieldset" disabled>');
    expect(html).not.toContain('>Save<');
  });

  test('renders validation summary and field messages on edit page', () => {
    const html = env.render('counter-service-opening-hours-edit.njk', {
      courtId,
      days: [],
      errors: {
        appointmentNeeded: 'Select yes if appointment is needed',
        assistWith: 'Select what the counter can assist with',
        sameTimeYes: 'Select yes if the same opening hours apply Monday to Friday',
      },
      errorSummary: [
        { href: '#assistWith', text: 'Select what the counter can assist with' },
        { href: '#appointmentNeeded', text: 'Select yes if appointment is needed' },
      ],
      form: {},
      pagePath: `/courts/${courtId}/edit/counter-service-opening-hours/add`,
      pageTitle: 'Counter service opening hours',
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Select what the counter can assist with');
    expect(html).toContain('Select yes if appointment is needed');
    expect(html).toContain('Select yes if the same opening hours apply Monday to Friday');
  });
});


