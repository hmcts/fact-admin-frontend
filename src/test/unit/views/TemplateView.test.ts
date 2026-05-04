import { env } from '../../../testUtils/nunjucksHelper';

describe('Template View', () => {
  test('renders the shared service navigation and footer shell', () => {
    const html = env.render('template.njk', {
      pagePath: '/',
    });

    expect(html).toContain('Find a Court or Tribunal Admin');
    expect(html).toContain('Courts');
    expect(html).toContain('Download csv');
    expect(html).toContain('Add new court');
    expect(html).toContain('Audit');
    expect(html).toContain('Users');
  });
});
