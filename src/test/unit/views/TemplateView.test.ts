import { env } from '../../../testUtils/nunjucksHelper';

describe('Template View', () => {
  test('renders the shared service navigation and footer shell for admin users', () => {
    const html = env.render('template.njk', {
      pagePath: '/',
    });

    expect(html).toContain('Find a Court or Tribunal Admin');
    expect(html).toContain('Sign out');
    expect(html).toContain('href="/sso/logout"');
    expect(html).toContain('Courts');
    expect(html).toContain('Download csv');
    expect(html).toContain('Add new court');
    expect(html).not.toContain('Audit');
    expect(html).not.toContain('Users');
  });

  test('renders super admin navigation links for super admin users', () => {
    const html = env.render('template.njk', {
      isSuperAdmin: true,
      pagePath: '/',
    });

    expect(html).toContain('Audit');
    expect(html).toContain('Users');
  });
});
