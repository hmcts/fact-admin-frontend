import { env } from '../../../testUtils/nunjucksHelper';

describe('Error View', () => {
  test('renders the generic error page content', () => {
    const html = env.render('error.njk', {
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit',
    });

    expect(html).toContain('Something went wrong');
  });
});
