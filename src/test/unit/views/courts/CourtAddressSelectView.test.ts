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

describe.each(['court-address-select.njk', 'service-centre-address-select.njk'])(
  '%s postcode metadata guidance',
  template => {
    const pagePath = template.startsWith('court-')
      ? `/courts/${ids.courtId}/edit/address/select`
      : `/service-centres/${ids.courtId}/edit/address/select`;
    test.each([
      { addresses: [], addressId: undefined },
      { addresses: [], addressId: ids.addressId },
      { addresses: [{ address: '1 High Street' }], addressId: undefined },
      { addresses: [{ address: '1 High Street' }], addressId: ids.addressId },
    ])('submits the lookup postcode only from the manual-entry form for %j', ({ addresses, addressId }) => {
      const html = env.render(template, {
        courtId: ids.courtId,
        serviceCentreId: ids.courtId,
        addressId,
        addresses,
        postcode: 'BS1 6GR',
        isNewSC: true,
        pagePath,
      });
      const forms = html.match(/<form\b[\s\S]*?<\/form>/g) ?? [];
      const manualForm = forms.find(form => form.includes('Enter address manually'));
      expect(manualForm).toContain('<input type="hidden" name="postcode" value="BS1 6GR">');
      expect(manualForm).toContain(`/edit/address/details${addressId ? `/${addressId}` : ''}`);
      expect(manualForm?.includes('<input type="hidden" name="isNewSC" value="true">')).toBe(
        template.startsWith('service-centre-')
      );
      const selectForm = forms.find(form => form.includes('Choose an address'));
      expect(Boolean(selectForm)).toBe(addresses.length > 0);
      expect(selectForm ?? '').not.toContain('name="postcode"');
    });

    const terminatedMessage = 'The postcode you have entered is a terminated postcode.';
    const largeUserMessage =
      'The postcode you have entered is a large user postcode. A large user postcode covers a large rural area or is used by a location that receives large volumes of mail.';
    const manualEntryMessage =
      'You can still enter an address using this postcode, but you will need to enter the address manually.';

    test.each([
      { largeUser: false, terminated: true },
      { largeUser: true, terminated: false },
      { largeUser: true, terminated: true },
      { largeUser: false, terminated: false },
      null,
      undefined,
    ])('renders only applicable guidance for empty options and metadata %j', postcodeMetadata => {
      const html = env.render(template, {
        addresses: [],
        courtId: ids.courtId,
        serviceCentreId: ids.courtId,
        postcode: 'NG8 5RN',
        postcodeMetadata,
        pagePath,
        pageTitle: 'Select an address',
      });

      const hasPostcodeGuidance = postcodeMetadata?.terminated === true || postcodeMetadata?.largeUser === true;
      expect(html.includes('No addresses were found for this postcode. Enter the address manually.')).toBe(
        !hasPostcodeGuidance
      );
      expect(html.split(manualEntryMessage).length - 1).toBe(hasPostcodeGuidance ? 1 : 0);
      expect(html.includes(`<p class="govuk-body">${manualEntryMessage}</p>`)).toBe(hasPostcodeGuidance);
      expect(html).toContain('Enter address manually');
      expect(html).not.toContain('Choose an address');
      expect(html.includes(terminatedMessage)).toBe(postcodeMetadata?.terminated === true);
      expect(html.includes(largeUserMessage)).toBe(postcodeMetadata?.largeUser === true);
    });

    test('does not show metadata guidance when selectable addresses exist', () => {
      const html = env.render(template, {
        addresses: [{ address: '1 High Street, Bristol, BS1 5AH' }],
        courtId: ids.courtId,
        serviceCentreId: ids.courtId,
        postcode: 'BS1 5AH',
        postcodeMetadata: { largeUser: true, terminated: true },
        pagePath,
        pageTitle: 'Select an address',
      });

      expect(html).toContain('Choose an address');
      expect(html).toContain('Continue');
      expect(html).toContain('Enter address manually');
      expect(html).not.toContain('No addresses were found');
      expect(html).not.toContain(terminatedMessage);
      expect(html).not.toContain(largeUserMessage);
      expect(html).not.toContain(manualEntryMessage);
    });
  }
);
