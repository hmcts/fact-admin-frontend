import { env } from '../../../testUtils/nunjucksHelper';

describe('Users View', () => {
  test('renders the users page for super admin users', () => {
    const html = env.render('users.njk', {
      isSuperAdmin: true,
      pagePath: '/users',
      pageTitle: 'Users',
    });

    expect(html).toContain('Users');
    expect(html).toContain('Audit');
  });
});
