import { env } from '../../../testUtils/nunjucksHelper';

const courtId = '11111111-1111-4111-8111-111111111111';
const serviceCentreId = '22222222-2222-4222-8222-222222222222';
const itemId = '33333333-3333-4333-8333-333333333333';

describe('Delete confirmation cancel links', () => {
  test.each([
    {
      view: 'court-address-delete.njk',
      model: {
        address: {
          addressLine1: '1 High Street',
          addressType: 'VISIT_US',
          courtId,
          id: itemId,
          postcode: 'AB1 2CD',
          townCity: 'Reading',
        },
        courtName: 'Reading Crown Court',
      },
      cancelHref: `/courts/${courtId}/edit/address`,
    },
    {
      view: 'service-centre-address-delete.njk',
      model: {
        address: {
          addressLine1: '1 High Street',
          addressType: 'VISIT_US',
          id: itemId,
          postcode: 'AB1 2CD',
          serviceCentreId,
          townCity: 'Reading',
        },
        serviceCentreName: 'Reading Service Centre',
      },
      cancelHref: `/service-centres/${serviceCentreId}/edit/address`,
    },
    {
      view: 'court-contact-delete.njk',
      model: {
        contactDetail: { description: 'Enquiries', phoneNumber: '01234 567890' },
        contactDetailId: itemId,
        courtId,
        courtName: 'Reading Crown Court',
      },
      cancelHref: `/courts/${courtId}/edit/contact-details`,
    },
    {
      view: 'service-centre-contact-delete.njk',
      model: {
        contactDetail: { description: 'Enquiries', phoneNumber: '01234 567890' },
        contactDetailId: itemId,
        serviceCentreId,
        serviceCentreName: 'Reading Service Centre',
      },
      cancelHref: `/service-centres/${serviceCentreId}/edit/contact-details`,
    },
    {
      view: 'counter-service-opening-hours-delete.njk',
      model: { assistanceAvailable: 'Forms', counterServiceId: itemId, courtId, courtName: 'Reading Crown Court' },
      cancelHref: `/courts/${courtId}/edit/counter-service-opening-hours`,
    },
    {
      view: 'court-opening-hours-delete.njk',
      model: { courtId, courtName: 'Reading Crown Court', openingHoursId: itemId, openingHourType: 'Court open' },
      cancelHref: `/courts/${courtId}/edit/court-opening-hours`,
    },
  ])('$view renders Cancel as a link to its section', ({ view, model, cancelHref }) => {
    const html = env.render(view, { ...model, cancelHref, pagePath: '/test' });

    expect(html).toContain('class="govuk-button-group"');
    expect(html).toContain(`href="${cancelHref}">Cancel</a>`);
    expect(html).not.toContain('govuk-button--secondary');
    expect(html).not.toContain('id="cancel_form"');
  });
});
