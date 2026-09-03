import { env } from '../../../../testUtils/nunjucksHelper';

describe('Court Contact View', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const contactDetailId = '22222222-2222-4222-8222-222222222222';

  test('renders contact list with edit controls for admin users', () => {
    const html = env.render('court-contact-list.njk', {
      courtContactDetails: [
        {
          deleteHref: `/courts/${courtId}/edit/contact-details/delete/${contactDetailId}`,
          description: 'Enquiries',
          editHref: `/courts/${courtId}/edit/contact-details/edit/${contactDetailId}`,
          email: 'court@example.com',
          phoneNumber: '01234 567890',
        },
      ],
      courtId,
      pagePath: `/courts/${courtId}/edit/contact-details`,
      pageTitle: 'Contact details',
    });

    expect(html).toContain('Contact details');
    expect(html).toContain('Edit');
    expect(html).toContain('Delete');
    expect(html).toContain('Add contact detail');
    expect(html).toContain(`/courts/${courtId}/edit/contact-details/add`);
  });

  test('renders contact list as view-only for viewer users', () => {
    const html = env.render('court-contact-list.njk', {
      courtContactDetails: [
        {
          deleteHref: `/courts/${courtId}/edit/contact-details/delete/${contactDetailId}`,
          description: 'Enquiries',
          editHref: `/courts/${courtId}/edit/contact-details/edit/${contactDetailId}`,
          email: 'court@example.com',
          phoneNumber: '01234 567890',
        },
      ],
      courtId,
      isViewer: true,
      pagePath: `/courts/${courtId}/edit/contact-details`,
      pageTitle: 'Contact details',
    });

    expect(html).toContain('View');
    expect(html).not.toContain('Delete');
    expect(html).not.toContain('Add contact detail');
  });

  test('renders contact form page with save button for admin users', () => {
    const html = env.render('court-contact-form.njk', {
      contactDescriptionTypeItems: [
        { text: 'Select', value: '' },
        { selected: true, text: 'Enquiries', value: 'enquiries' },
      ],
      errorSummary: [],
      formAction: `/courts/${courtId}/edit/contact-details/add/success`,
      formErrors: {},
      formHeading: 'Add contact details',
      formValues: {
        contactEmail: 'court@example.com',
        contactExplanation: '',
        contactExplanationCy: '',
        contactMethods: ['email', 'phone'],
        contactTelephone: '01234 567890',
      },
      pagePath: `/courts/${courtId}/edit/contact-details/add`,
      pageTitle: 'Add contact details',
    });

    expect(html).toContain('Add contact details');
    expect(html).toContain('Contact type');
    expect(html).toContain('Explanation (optional)');
    expect(html).toContain('Explanation in Welsh (optional)');
    expect(html).toContain('Select all that apply');
    expect(html).toContain(`action="/courts/${courtId}/edit/contact-details/add/success"`);
    expect(html).toContain('class="govuk-button"');
    expect(html).toContain('Save');
  });

  test('renders contact form as view-only for viewer users', () => {
    const html = env.render('court-contact-form.njk', {
      contactDescriptionTypeItems: [{ selected: true, text: 'Enquiries', value: 'enquiries' }],
      formAction: `/courts/${courtId}/edit/contact-details/edit/${contactDetailId}/success`,
      formErrors: {},
      formHeading: 'Edit contact details',
      formValues: {
        contactEmail: 'court@example.com',
        contactExplanation: '',
        contactMethods: ['email'],
        contactTelephone: '',
      },
      isViewer: true,
      pagePath: `/courts/${courtId}/edit/contact-details/edit/${contactDetailId}`,
      pageTitle: 'Contact details',
    });

    expect(html).toContain('View contact details');
    expect(html).toContain('<fieldset class="govuk-fieldset" disabled>');
    expect(html).not.toContain('class="govuk-button"');
  });

  test('renders delete confirmation with expected action and cancel link', () => {
    const html = env.render('court-contact-delete.njk', {
      cancelHref: `/courts/${courtId}/edit/contact-details`,
      contactDetail: {
        description: 'Enquiries',
        email: 'court@example.com',
        explanation: 'For general enquiries',
        phoneNumber: '01234 567890',
      },
      contactDetailId,
      courtId,
      courtName: 'Reading Crown Court',
      pagePath: `/courts/${courtId}/edit/contact-details/delete/${contactDetailId}`,
      pageTitle: 'Delete contact details',
    });

    expect(html).toContain('Are you sure you want to delete these contact details?');
    expect(html).toContain(`action="/courts/${courtId}/edit/contact-details/delete/${contactDetailId}/success"`);
    expect(html).toContain('Phone: 01234 567890');
    expect(html).toContain('Email: court@example.com');
    expect(html).toContain(`href="/courts/${courtId}/edit/contact-details">Cancel</a>`);
  });
});
