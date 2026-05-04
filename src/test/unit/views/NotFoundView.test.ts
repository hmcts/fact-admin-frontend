import { env } from '../../../testUtils/nunjucksHelper';

describe('Not Found View', () => {
  test('renders the generic not found page content', () => {
    const html = env.render('not-found.njk', {
      pagePath: '/missing-page',
    });

    expect(html).toContain('Page Not Found');
  });
});
