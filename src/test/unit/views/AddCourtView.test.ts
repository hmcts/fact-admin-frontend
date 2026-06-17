import { env } from '../../../testUtils/nunjucksHelper';

describe('Add Court View', () => {
  test('renders the add court page heading', () => {
    const html = env.render('add-court.njk', {
      pagePath: '/add-court',
      pageTitle: 'Add new court',
      regions: [
        { id: '22222222-2222-4222-8222-222222222222', name: 'South East' },
        { id: '33333333-3333-4333-8333-333333333333', name: 'North West' },
      ],
    });

    expect(html).toContain('Add new court');
    expect(html).toContain('Court will be closed by default.');
    expect(html).toContain('Name');
    expect(html).toContain('Enter the name of the court. Only capitalise the first letter.');
    expect(html).toContain('Region');
    expect(html).toContain('Select the region in which the court is located.');
    expect(html).toContain('South East');
    expect(html).toContain('North West');
    expect(html).toContain('Add court');
    expect(html).toContain('action="/add-court"');
  });

  test('renders validation errors', () => {
    const html = env.render('add-court.njk', {
      errors: {
        name: ['Enter a name for the court'],
        regionId: ['Select a region for the court'],
      },
      name: '',
      pagePath: '/add-court',
      pageTitle: 'Error: Add new court',
      regionId: '',
      regions: [{ id: '22222222-2222-4222-8222-222222222222', name: 'South East' }],
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Enter a name for the court');
    expect(html).toContain('href="#name"');
    expect(html).toContain('Select a region for the court');
    expect(html).toContain('href="#regionId"');
  });

  test('renders the add court success loading page', () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const html = env.render('add-court-success.njk', {
      addressRedirectUrl: `/courts/${courtId}/edit/address`,
      courtId,
      courtName: 'Reading Crown Court',
      pagePath: '/add-court/success',
      pageTitle: 'New court created - Reading Crown Court',
    });

    expect(html).toContain('New court created - Reading Crown Court');
    expect(html).toContain(
      'New court has been created, you will be redirected to the edit address page shortly. If you do not add an address the court will be marked as closed.'
    );
    expect(html).toContain('hods-loading-spinner');
    expect(html).toContain('role="status"');
    expect(html).toContain(`data-redirect-url="/courts/${courtId}/edit/address"`);
    expect(html).toContain('data-redirect-delay="7000"');
    expect(html).toContain('Continue to add an address for Reading Crown Court');
  });
});
