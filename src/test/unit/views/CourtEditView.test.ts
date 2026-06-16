import { env } from '../../../testUtils/nunjucksHelper';

describe('Court Edit View', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const courtEditPath = `/courts/${courtId}/edit`;

  test('renders the court edit page heading and section links', () => {
    const html = env.render('court-edit.njk', {
      courtId,
      courtName: 'Reading Crown Court',
      pagePath: courtEditPath,
      pageTitle: 'Editing - Reading Crown Court',
    });

    expect(html).toContain('Editing - Reading Crown Court');
    expect(html).toContain(`${courtEditPath}/accessibility`);
    expect(html).toContain(`${courtEditPath}/general`);
    expect(html).toContain(`${courtEditPath}/cases-heard`);
    expect(html).toContain(`${courtEditPath}/information-for-professionals`);
    expect(html).toContain('Information for professionals');
    expect(html).toContain('Local authorities');
    expect(html).toContain(`${courtEditPath}/translation-and-interpretation`);
    expect(html).toContain(`${courtEditPath}/warning-notice`);
    expect(html).toContain('TODO');
  });
});
