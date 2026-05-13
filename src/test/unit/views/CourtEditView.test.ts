import { env } from '../../../testUtils/nunjucksHelper';

describe('Court Edit View', () => {
  test('renders the court edit page heading and section links', () => {
    const html = env.render('court-edit.njk', {
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit',
      pageTitle: 'Editing - Reading Crown Court',
    });

    expect(html).toContain('Editing - Reading Crown Court');
    expect(html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/accessibility');
    expect(html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/general');
    expect(html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/translation-and-interpretation');
    expect(html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit/warning-notice');
    expect(html).toContain('TODO');
  });
});
