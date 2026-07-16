import { env } from '../../../testUtils/nunjucksHelper';

describe('Viewer nested details views', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  test('shows contact details as view-only without add, delete, or save controls', () => {
    const listHtml = env.render('court-contact-list.njk', {
      courtContactDetails: [
        {
          deleteHref: `/courts/${courtId}/edit/contact-details/delete/contact-id`,
          description: 'Enquiries',
          editHref: `/courts/${courtId}/edit/contact-details/edit/contact-id`,
          email: 'court@example.com',
          phoneNumber: '01234 567890',
        },
      ],
      courtId,
      isViewer: true,
      pagePath: `/courts/${courtId}/edit/contact-details`,
      pageTitle: 'Contact details',
    });
    const formHtml = env.render('court-contact-form.njk', {
      contactDescriptionTypeItems: [{ selected: true, text: 'Enquiries', value: 'enquiries' }],
      formAction: `/courts/${courtId}/edit/contact-details/edit/contact-id/success`,
      formHeading: 'Edit contact details',
      formValues: {
        contactEmail: 'court@example.com',
        contactExplanation: '',
        contactMethods: ['email'],
      },
      isViewer: true,
      pagePath: `/courts/${courtId}/edit/contact-details/edit/contact-id`,
      pageTitle: 'Contact details',
    });

    expect(listHtml).toContain('View');
    expect(listHtml).not.toContain('Delete');
    expect(listHtml).not.toContain('Add contact detail');
    expect(formHtml).toContain('View contact details');
    expect(formHtml).toContain('<fieldset class="govuk-fieldset" disabled>');
    expect(formHtml).not.toContain('>Save<');
  });

  test('shows opening hours as view-only without add, delete, or save controls', () => {
    const listHtml = env.render('court-opening-hours.njk', {
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
    const formHtml = env.render('court-opening-hours-edit.njk', {
      courtId,
      days: [],
      errors: {},
      form: {
        openingHourTypeId: 'type-id',
        sameTime: undefined,
        selectedDays: [],
      },
      isViewer: true,
      openingHourTypes: [{ id: 'type-id', name: 'Court open' }],
      openingHoursId: 'opening-hours-id',
      pagePath: `/courts/${courtId}/edit/court-opening-hours/edit/opening-hours-id`,
      pageTitle: 'Court opening hours',
    });

    expect(listHtml).toContain('View');
    expect(listHtml).not.toContain('Delete');
    expect(listHtml).not.toContain('Add opening hours');
    expect(formHtml).toContain('View opening hours');
    expect(formHtml).toContain('<fieldset class="govuk-fieldset" disabled>');
    expect(formHtml).not.toContain('>Save<');
  });
});
