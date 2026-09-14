import { env } from '../../../../testUtils/nunjucksHelper';

const ids = {
  addressId: '22222222-2222-4222-8222-222222222222',
  courtId: '11111111-1111-4111-8111-111111111111',
};

describe('Court Address Edit Success View', () => {
  test('renders saved success panel and navigation links', () => {
    const html = env.render('common-edit-success.njk', {
      courtId: ids.courtId,
      courtName: 'Reading Crown Court',
      pageTitle: 'Address Saved',
      successPanelTitle: 'Address saved: 1 High Street, Bristol, BS1 5AH',
      successPanelBody: 'Addresses for Reading Crown Court have been successfully updated.',
      continueUpdatingHref: `/courts/${ids.courtId}/edit/address`,
      continueUpdatingText: 'Back to addresses',
      pagePath: `/courts/${ids.courtId}/edit/address/details/success/${ids.addressId}`,
    });

    expect(html).toContain('Address Saved');
    expect(html).toContain('Address saved:');
    expect(html).toContain('Addresses for Reading Crown Court have been successfully updated.');
    expect(html).not.toContain('The court is now open.');
    expect(html).toContain(`/courts/${ids.courtId}/edit/address`);
    expect(html).toContain('href="/"');
  });

  test('renders court opened message when the first address opens the court', () => {
    const html = env.render('common-edit-success.njk', {
      courtId: ids.courtId,
      courtName: 'Reading Crown Court',
      pageTitle: 'Address Saved',
      successPanelTitle: 'Address saved: 1 High Street, Bristol, BS1 5AH',
      successPanelBody: 'Addresses for Reading Crown Court have been successfully updated. The court is now open.',
      continueUpdatingHref: `/courts/${ids.courtId}/edit/address`,
      continueUpdatingText: 'Back to addresses',
      pagePath: `/courts/${ids.courtId}/edit/address/details/success`,
    });

    expect(html).toContain('Addresses for Reading Crown Court have been successfully updated. The court is now open.');
  });
});
