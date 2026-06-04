import { env } from '../../../testUtils/nunjucksHelper';

const ids = {
  addressId: '22222222-2222-4222-8222-222222222222',
  courtId: '11111111-1111-4111-8111-111111111111',
};

describe('Court Address Find View', () => {
  test('renders postcode lookup and manual entry actions', () => {
    const html = env.render('court-address-find.njk', {
      addressId: undefined,
      courtId: ids.courtId,
      error: undefined,
      pagePath: `/courts/${ids.courtId}/edit/address/find`,
      pageTitle: 'Find address by postcode',
      postcode: 'BS1 6GR',
    });

    expect(html).toContain('Find address by postcode');
    expect(html).toContain('Postcode');
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/select`);
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/details`);
    expect(html).toContain('Enter address manually');
  });

  test('renders validation error summary and address-specific actions', () => {
    const html = env.render('court-address-find.njk', {
      addressId: ids.addressId,
      courtId: ids.courtId,
      error: 'Enter a full UK postcode',
      pagePath: `/courts/${ids.courtId}/edit/address/find/${ids.addressId}`,
      pageTitle: 'Find address by postcode',
      postcode: '',
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Enter a full UK postcode');
    expect(html).toContain('href="#postcode"');
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/select/${ids.addressId}`);
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/details/${ids.addressId}`);
  });
});
