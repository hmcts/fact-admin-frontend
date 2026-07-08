import { env } from '../../../testUtils/nunjucksHelper';

describe('Users View', () => {
  test('renders the users page for super admin users', () => {
    const html = env.render('users.njk', {
      errorSummary: [],
      filters: {
        pageNumber: 0,
        pageSize: 25,
        search: '',
        sortBy: '',
        sortOrder: 'asc',
      },
      isSuperAdmin: true,
      pagination: {
        items: [],
        totalPages: 0,
      },
      pagePath: '/users',
      pageTitle: 'Users',
      resultsMessage: 'Showing 1 to 2 of 2 users',
      userTableHead: [{ text: 'Email' }, { text: 'SSO ID' }, { text: 'Last login' }, { text: 'Role(s)' }],
      userTableRows: [
        [
          { text: 'admin@example.com' },
          { text: '11111111-1111-4111-8111-111111111111' },
          { text: '8 Jul 2026, 10:30' },
          { text: 'Admin' },
        ],
      ],
    });

    expect(html).toContain('Users');
    expect(html).toContain('Audit');
    expect(html).toContain('Search by email or SSO ID');
    expect(html).toContain('Email');
    expect(html).toContain('SSO ID');
    expect(html).toContain('Last login');
    expect(html).toContain('Role(s)');
    expect(html).toContain('admin@example.com');
  });
});
