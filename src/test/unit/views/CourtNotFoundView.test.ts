import { env } from '../../../testUtils/nunjucksHelper';

describe('Court Not Found View', () => {
  test('renders the dedicated court not found content', () => {
    const html = env.render('court-not-found.njk', {
      pagePath: '/courts/not-a-real-court/edit',
    });

    expect(html).toContain('Court not found');
    expect(html).toContain('This court does not exist.');
    expect(html).toContain('Return to the home page to view another court');
    expect(html).toContain('href="/"');
  });
});
