import { env } from '../../../testUtils/nunjucksHelper';

describe('Lock Exists View', () => {
  test('renders lock owner email when lock user details are present', () => {
    const html = env.render('lock-exists.njk', {
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit/address',
      subject: 'court',
      page: 'address',
      lock: {
        user: {
          email: 'other.editor@justice.gov.uk',
        },
      },
    });

    expect(html).toContain('Already Locked');
    expect(html).toContain('The court address page is currently locked by user:');
    expect(html).toContain('other.editor@justice.gov.uk');
  });

  test('renders fallback text when lock user details are missing', () => {
    const html = env.render('lock-exists.njk', {
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit/address',
      subject: 'court',
      page: 'address',
      lock: null,
    });

    expect(html).toContain('Already Locked');
    expect(html).toContain('The court address  page is currently locked by another user.');
  });
});
