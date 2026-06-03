import { env } from '../../../testUtils/nunjucksHelper';

const ids = {
  addressId: '22222222-2222-4222-8222-222222222222',
  courtId: '11111111-1111-4111-8111-111111111111',
};

describe('Court Address Delete View', () => {
  test('renders delete confirmation details and action', () => {
    const html = env.render('court-address-delete.njk', {
      address: {
        addressLine1: '10 Downing Street',
        courtId: ids.courtId,
        id: ids.addressId,
        postcode: 'SW1A 2AA',
        townCity: 'London',
        addressType: 'VISIT_US',
      },
      courtName: 'Reading Crown Court',
      pagePath: `/courts/${ids.courtId}/edit/address/delete/${ids.addressId}`,
      pageTitle: 'Delete address',
    });

    expect(html).toContain('Are you sure you want to delete this address?');
    expect(html).toContain('Reading Crown Court');
    expect(html).toContain('Visit');
    expect(html).toContain('10 Downing Street');
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/delete/success/${ids.addressId}`);
    expect(html).toContain('Delete address');
  });
});
