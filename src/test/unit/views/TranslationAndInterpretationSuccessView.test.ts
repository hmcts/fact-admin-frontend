import { env } from '../../../testUtils/nunjucksHelper';

describe('Translation and Interpretation Success View', () => {
  test('renders the success panel and next actions', () => {
    const html = env.render('translation-and-interpretation-success.njk', {
      courtId: '11111111-1111-4111-8111-111111111111',
      courtName: 'Reading Crown Court',
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit/translation-and-interpretation',
    });

    expect(html).toContain('Translation and interpretation saved');
    expect(html).toContain(
      'Translation and interpretation contact for Reading Crown Court has been saved successfully.'
    );
    expect(html).toContain('What do you want to do next?');
    expect(html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit');
    expect(html).toContain('Continue updating Reading Crown Court');
    expect(html).toContain('Home');
  });
});
