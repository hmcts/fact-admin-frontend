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
      showApproveData: false,
    });

    expect(html).toContain('Editing - Reading Crown Court');
    expect(html).toContain(`${courtEditPath}/accessibility`);
    expect(html).toContain(`${courtEditPath}/general`);
    expect(html).toContain(`${courtEditPath}/cases-heard`);
    expect(html).toContain(`${courtEditPath}/information-for-professionals`);
    expect(html).toContain('Information for professionals');
    expect(html).toContain(`${courtEditPath}/single-point-of-entry`);
    expect(html).toContain('Single points of entry');
    expect(html).toContain('Local authorities');
    expect(html).toContain(`${courtEditPath}/translation-and-interpretation`);
    expect(html).toContain(`${courtEditPath}/warning-notice`);
    expect(html).toContain('TODO');
    expect(html).not.toContain('Approve data');
  });

  test('renders the approve data prompt and link', () => {
    const html = env.render('court-edit.njk', {
      approvePath: `${courtEditPath}/approve`,
      courtId,
      courtName: 'Reading Crown Court',
      pagePath: courtEditPath,
      pageTitle: 'Editing - Reading Crown Court',
      showApproveData: true,
    });

    expect(html).toContain(
      'Once you have reviewed all the inputted data for this court/service centre/tribunal, please approve.'
    );
    expect(html).toContain('nationalsupportunit@justice.gov.uk');
    expect(html).toContain('Approve data');
    expect(html).toContain(`href="${courtEditPath}/approve"`);
    expect(html.indexOf('court-edit-table__wrapper')).toBeLessThan(html.indexOf('id="approve-data-heading"'));
  });
});
