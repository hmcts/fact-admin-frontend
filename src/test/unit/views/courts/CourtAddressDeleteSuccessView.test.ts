import { env } from '../../../../testUtils/nunjucksHelper';

const ids = {
  addressId: '22222222-2222-4222-8222-222222222222',
  courtId: '11111111-1111-4111-8111-111111111111',
};

describe('Court Address Delete Success View', () => {
  test('renders success panel and next-step links', () => {
    const html = env.render('common-edit-success.njk', {
      courtId: ids.courtId,
      courtName: 'Reading Crown Court',
      pageTitle: 'Address Deleted',
      successPanelTitle: 'Address deleted: 10 Downing Street, London, SW1A 2AA',
      successPanelBody: 'You have removed this address for Reading Crown Court',
      continueUpdatingHref: `/courts/${ids.courtId}/edit/address`,
      continueUpdatingText: 'Back to addresses',
      pagePath: `/courts/${ids.courtId}/edit/address/delete/success/${ids.addressId}`,
    });

    expect(html).toContain('Address Deleted');
    expect(html).toContain('Address deleted:');
    expect(html).toContain('You have removed this address for Reading Crown Court');
    expect(html).toContain(`/courts/${ids.courtId}/edit/address`);
    expect(html).toContain('href="/"');
  });
});
