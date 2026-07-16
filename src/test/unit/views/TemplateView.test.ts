import { env } from '../../../testUtils/nunjucksHelper';

describe('Template View', () => {
  test('renders the shared service navigation and footer shell for admin users', () => {
    const html = env.render('template.njk', {
      pagePath: '/',
    });

    expect(html).toContain('Find a Court or Tribunal Admin');
    expect(html).toContain('govuk-service-navigation app-service-navigation');
    expect(html).toContain('Locations');
    expect(html).toContain('Download csv');
    expect(html).toContain('Add new court');
    expect(html).toContain('Add new service centre');
    expect(html).toContain('Approvals tracker');
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
    expect(html).toContain('Approvals tracker');
  });

  test('renders only location navigation for viewer users', () => {
    const html = env.render('template.njk', {
      isViewer: true,
      pagePath: '/',
    });

    expect(html).toContain('Locations');
    expect(html).not.toContain('Download csv');
    expect(html).not.toContain('Add new court');
    expect(html).not.toContain('Add new service centre');
    expect(html).not.toContain('Approvals tracker');
    expect(html).not.toContain('Audits');
    expect(html).not.toContain('Users');
  });
});
