import { env } from '../../../testUtils/nunjucksHelper';

describe('Lock Failed View', () => {
  test('renders lock failure message including subject and page', () => {
    const html = env.render('lock-failed.njk', {
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit/address',
      subject: 'court',
      page: 'address',
    });

    expect(html).toContain('Lock Failed');
    expect(html).toContain('It was not possible to acquire a lock for the court address page');
  });
});
