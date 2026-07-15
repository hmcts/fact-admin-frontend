import { env } from '../../../testUtils/nunjucksHelper';

describe('Service Centre Contact Views', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';

  test('renders contact list page', () => {
    const html = env.render('service-centre-contact-list.njk', {
      pagePath: `/service-centres/${serviceCentreId}/edit/contact-details`,
      pageTitle: 'Manage Contact details - Reading Service Centre',
      serviceCentreContactDetails: [
        {
          deleteHref: `/service-centres/${serviceCentreId}/edit/contact-details/delete/99999999-9999-4999-8999-999999999999`,
          description: 'General enquiries',
          editHref: `/service-centres/${serviceCentreId}/edit/contact-details/edit/99999999-9999-4999-8999-999999999999`,
          email: 'enquiries@example.test',
          phoneNumber: '01234 567890',
        },
      ],
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(html).toContain('Contact details');
    expect(html).toContain('General enquiries');
    expect(html).toContain('enquiries@example.test');
    expect(html).toContain(`/service-centres/${serviceCentreId}/edit/contact-details/add`);
  });

  test('renders contact form page', () => {
    const html = env.render('service-centre-contact-form.njk', {
      contactDescriptionTypeItems: [
        { text: 'Select', value: '' },
        { selected: true, text: 'General enquiries', value: 'a' },
      ],
      errorSummary: [],
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formErrors: {},
      formHeading: 'Add contact details',
      formValues: {
        contactEmail: '',
        contactExplanation: '',
        contactExplanationCy: '',
        contactMethods: [],
        contactTelephone: '',
      },
      pagePath: `/service-centres/${serviceCentreId}/edit/contact-details/add`,
      pageTitle: 'Add contact details - Reading Service Centre',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(html).toContain('Add contact details');
    expect(html).toContain('Contact type');
    expect(html).toContain('Explanation (optional)');
    expect(html).toContain('Explanation in welsh (optional)');
    expect(html).toContain('Select all that apply');
    expect(html).toContain(`/service-centres/${serviceCentreId}/edit/contact-details/add/success`);
  });
});
