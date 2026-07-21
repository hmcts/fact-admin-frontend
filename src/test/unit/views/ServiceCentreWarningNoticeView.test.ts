import { env } from '../../../testUtils/nunjucksHelper';

describe('Service Centre Warning Notice View', () => {
  test('renders warning notice form with 250 char limit', () => {
    const html = env.render('service-centre-warning-notice-edit.njk', {
      model: {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Reading Service Centre',
        warningNotice: '',
      },
      pagePath: '/service-centres/11111111-1111-4111-8111-111111111111/edit/warning-notice',
      pageTitle: 'Warning notice - Reading Service Centre',
    });

    expect(html).toContain('Warning notice');
    expect(html).toContain('This is limited to 250 characters');
    expect(html).toContain('maxlength="250"');
    expect(html).toContain('/service-centres/11111111-1111-4111-8111-111111111111/edit/warning-notice/success');
  });
});
