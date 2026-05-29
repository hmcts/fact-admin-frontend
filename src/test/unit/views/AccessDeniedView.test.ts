import { env } from '../../../testUtils/nunjucksHelper';

describe('Access Denied View', () => {
  test('renders the access denied content', () => {
    const html = env.render('access-denied.njk', {
      pagePath: '/users',
      pageTitle: 'Access Denied',
    });

    expect(html).toContain('Access Denied');
    expect(html).toContain('You do not have permission to view this page.');
    expect(html).toContain('Sign out');
  });
});
