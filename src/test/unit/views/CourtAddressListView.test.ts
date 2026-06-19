import { env } from '../../../testUtils/nunjucksHelper';

const ids = {
  courtId: '11111111-1111-4111-8111-111111111111',
  addressA: 'aaaaaaaa-1111-4111-8111-111111111111',
  addressB: 'bbbbbbbb-2222-4222-8222-222222222222',
  addressC: 'cccccccc-3333-4333-8333-333333333333',
};

describe('Court Address List View', () => {
  test('renders empty state and add address action', () => {
    const html = env.render('court-address-list.njk', {
      courtAddresses: [],
      courtId: ids.courtId,
      pagePath: `/courts/${ids.courtId}/edit/address`,
      pageTitle: 'Addresses',
    });

    expect(html).toContain('Addresses');
    expect(html).toContain('govuk-warning-text');
    expect(html).toContain('Warning');
    expect(html).toContain('If you do not add an address, this court will be marked as closed.');
    expect(html).toContain('No addresses are currently configured.');
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/find/`);
    expect(html).toContain('Add address');
  });

  test('renders address table and hides add address button when maxed', () => {
    const courtAddresses = [
      {
        addressLine1: '1 High Street',
        addressType: 'VISIT_US',
        courtId: ids.courtId,
        id: ids.addressA,
        postcode: 'BS1 5AH',
        townCity: 'Bristol',
      },
      {
        addressLine1: '2 High Street',
        addressType: 'WRITE_TO_US',
        courtId: ids.courtId,
        id: ids.addressB,
        postcode: 'BS1 6AH',
        townCity: 'Bristol',
      },
      {
        addressLine1: '3 High Street',
        addressType: 'VISIT_OR_CONTACT_US',
        courtId: ids.courtId,
        id: ids.addressC,
        postcode: 'BS1 7AH',
        townCity: 'Bristol',
      },
    ];

    const html = env.render('court-address-list.njk', {
      courtAddresses,
      courtId: ids.courtId,
      pagePath: `/courts/${ids.courtId}/edit/address`,
      pageTitle: 'Addresses',
    });

    expect(html).toContain('Address type');
    expect(html).toContain('Visit');
    expect(html).toContain('Send documents to');
    expect(html).toContain('Visit and send documents to');
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/find/${ids.addressA}`);
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/delete/${ids.addressA}`);
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/find/${ids.addressB}`);
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/delete/${ids.addressB}`);
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/find/${ids.addressC}`);
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/delete/${ids.addressC}`);
    expect(html).not.toContain('Add address');
    expect(html).not.toContain('If you do not add an address, this court will be marked as closed.');
  });

  test('does not render delete action when only one address exists', () => {
    const html = env.render('court-address-list.njk', {
      courtAddresses: [
        {
          addressLine1: '1 High Street',
          addressType: 'VISIT_US',
          courtId: ids.courtId,
          id: ids.addressA,
          postcode: 'BS1 5AH',
          townCity: 'Bristol',
        },
      ],
      courtId: ids.courtId,
      pagePath: `/courts/${ids.courtId}/edit/address`,
      pageTitle: 'Addresses',
    });

    expect(html).toContain(`/courts/${ids.courtId}/edit/address/find/${ids.addressA}`);
    expect(html).not.toContain(`/courts/${ids.courtId}/edit/address/delete/${ids.addressA}`);
  });
});
