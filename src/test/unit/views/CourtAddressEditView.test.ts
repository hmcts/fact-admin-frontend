import { env } from '../../../testUtils/nunjucksHelper';

const ids = {
  addressId: '22222222-2222-4222-8222-222222222222',
  courtId: '11111111-1111-4111-8111-111111111111',
};

describe('Court Address Edit View', () => {
  const baseContext = {
    address: {
      addressLine1: '1 High Street',
      addressLine2: 'Clifton',
      addressType: 'VISIT_OR_CONTACT_US',
      areasOfLaw: ['aol-2'],
      county: 'Avon',
      courtTypes: ['00000000-0000-4000-8000-000000000000'],
      epimId: '12345',
      errors: {},
      postcode: 'BS1 5AH',
      townCity: 'Bristol',
    },
    addressId: ids.addressId,
    aolSelected: true,
    areasOfLaw: [
      { id: 'aol-1', name: 'Civil' },
      { id: 'aol-2', name: 'Family' },
    ],
    courtId: ids.courtId,
    courtTypes: [
      { id: '00000000-0000-4000-8000-000000000000', name: 'County Court' },
      { id: '00000000-0000-4000-8000-000000000001', name: 'Crown Court' },
    ],
    ctSelected: true,
    pagePath: `/courts/${ids.courtId}/edit/address/details/${ids.addressId}`,
    pageTitle: 'Edit address',
  };

  test('renders address form fields and filtered sections', () => {
    const html = env.render('court-address-edit.njk', baseContext);

    expect(html).toContain('Address');
    expect(html).toContain('Enter an address');
    expect(html).toContain('Does this address only apply to a specific area of law?');
    expect(html).toContain('Does this address only apply to a specific court type?');
    expect(html).toContain(`/courts/${ids.courtId}/edit/address/details/success/${ids.addressId}`);
    expect(html).toContain('Save');
  });

  test('renders validation errors in summary and field-level messages', () => {
    const html = env.render('court-address-edit.njk', {
      ...baseContext,
      address: {
        ...baseContext.address,
        errors: {
          addressLine1: ['Enter address line 1'],
          addressType: ['Select an address type'],
          areasOfLaw: ['Select yes if this applies to an area of law'],
          courtTypes: ['Select yes if this applies to a court type'],
          postcode: ['Enter a postcode'],
        },
      },
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Select an address type');
    expect(html).toContain('Enter address line 1');
    expect(html).toContain('Select yes if this applies to an area of law');
    expect(html).toContain('Select yes if this applies to a court type');
    expect(html).toContain('Enter a postcode');
  });
});
