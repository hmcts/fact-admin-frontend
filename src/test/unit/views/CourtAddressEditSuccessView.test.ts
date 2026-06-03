import { env } from '../../../testUtils/nunjucksHelper';

const ids = {
  addressId: '22222222-2222-4222-8222-222222222222',
  courtId: '11111111-1111-4111-8111-111111111111',
};

describe('Court Address Edit Success View', () => {
  test('renders saved success panel and navigation links', () => {
    const html = env.render('court-address-edit-success.njk', {
      address: {
        addressLine1: '1 High Street',
        postcode: 'BS1 5AH',
        townCity: 'Bristol',
      },
      courtId: ids.courtId,
      courtName: 'Reading Crown Court',
      pagePath: `/courts/${ids.courtId}/edit/address/details/success/${ids.addressId}`,
    });

    expect(html).toContain('Address Saved');
    expect(html).toContain('Address saved:');
    expect(html).toContain('Addresses for Reading Crown Court have been successfully updated');
    expect(html).toContain(`/courts/${ids.courtId}/edit/address`);
    expect(html).toContain('href="/"');
  });
});
