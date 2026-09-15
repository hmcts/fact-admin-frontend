import { env } from '../../../../testUtils/nunjucksHelper';

const ids = {
  addressId: '22222222-2222-4222-8222-222222222222',
  courtId: '11111111-1111-4111-8111-111111111111',
};

describe('Court Address Select View', () => {
  test('renders postcode and address options for new address flow', () => {
    const html = env.render('court-address-select.njk', {
      addressId: undefined,
      addresses: [{ address: '1 High Street, Bristol, BS1 5AH' }, { address: '2 High Street, Bristol, BS1 5AH' }],
      courtId: ids.courtId,
      pagePath: `/courts/${ids.courtId}/edit/address/select`,
      pageTitle: 'Select an address',
      postcode: 'BS1 5AH',
    });

    expect(html).toContain('Select an address');
    expect(html).toContain('Postcode: BS1 5AH.');
    expect(html).toContain('Choose an address');
    expect(html).toContain('1 High Street, Bristol, BS1 5AH');
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/details`);
  });

  test('renders edit flow action when address id is provided', () => {
    const html = env.render('court-address-select.njk', {
      addressId: ids.addressId,
      addresses: [{ address: '10 Downing Street, London, SW1A 2AA' }],
      courtId: ids.courtId,
      pagePath: `/courts/${ids.courtId}/edit/address/select/${ids.addressId}`,
      pageTitle: 'Select an address',
      postcode: 'SW1A 2AA',
    });

    expect(html).toContain(`/courts/${ids.courtId}/edit/address/details/${ids.addressId}`);
    expect(html).toContain('Continue');
    expect(html).toContain('Enter address manually');
  });

  test('explains that manual entry is available when OS returns no options', () => {
    const html = env.render('court-address-select.njk', {
      addresses: [],
      courtId: ids.courtId,
      pagePath: `/courts/${ids.courtId}/edit/address/select`,
      pageTitle: 'Select an address',
      postcode: 'WR1 1EQ',
    });

    expect(html).toContain('No addresses were found for this postcode');
    expect(html).toContain('Enter address manually');
    expect(html).not.toContain('Choose an address');
  });
});
