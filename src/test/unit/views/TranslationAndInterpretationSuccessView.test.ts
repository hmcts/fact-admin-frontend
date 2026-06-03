import { env } from '../../../testUtils/nunjucksHelper';

describe('Translation and Interpretation Success View', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const courtEditPath = `/courts/${courtId}/edit`;

  test('renders the success panel and next actions', () => {
    const html = env.render('translation-and-interpretation-success.njk', {
      courtId,
      courtName: 'Reading Crown Court',
      pagePath: `${courtEditPath}/translation-and-interpretation`,
    });

    expect(html).toContain('Translation and interpretation saved');
    expect(html).toContain(
      'Translation and interpretation contact for Reading Crown Court has been saved successfully.'
    );
    expect(html).toContain('What do you want to do next?');
    expect(html).toContain(courtEditPath);
    expect(html).toContain('Continue updating Reading Crown Court');
    expect(html).toContain('Home');
  });
});
