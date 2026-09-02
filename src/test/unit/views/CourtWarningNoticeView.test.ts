import { env } from '../../../testUtils/nunjucksHelper';

describe('Court Warning Notice View', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  test('renders warning notice form with save control for admin users', () => {
    const html = env.render('court-warning-notice-edit.njk', {
      courtId,
      errors: {},
      errorSummary: [],
      form: {
        warningNotice: 'Court closed for maintenance.',
        warningNoticeCy: 'Llys ar gau ar gyfer gwaith cynnal a chadw.',
      },
      pagePath: `/courts/${courtId}/edit/warning-notice`,
      pageTitle: 'Warning notice',
    });

    expect(html).toContain('Warning notice');
    expect(html).toContain('Add a warning message (English)');
    expect(html).toContain('Add a warning message (Welsh)');
    expect(html).toContain(`action="/courts/${courtId}/edit/warning-notice/success"`);
    expect(html).toContain('class="govuk-button"');
    expect(html).toContain('Save');
  });

  test('shows court warning notices as view-only without a save control', () => {
    const html = env.render('court-warning-notice-edit.njk', {
      courtId,
      errors: {},
      errorSummary: [],
      form: {
        warningNotice: 'Court closed for maintenance.',
        warningNoticeCy: 'Llys ar gau ar gyfer gwaith cynnal a chadw.',
      },
      isViewer: true,
      pagePath: `/courts/${courtId}/edit/warning-notice`,
      pageTitle: 'Warning notice',
    });

    expect(html).toContain('<fieldset class="govuk-fieldset" disabled>');
    expect(html).not.toContain('class="govuk-button"');
  });

  test('renders validation summary and field errors', () => {
    const html = env.render('court-warning-notice-edit.njk', {
      courtId,
      errors: {
        warningNotice: 'Enter a warning message in English',
        warningNoticeCy: 'Enter a warning message in Welsh',
      },
      errorSummary: [
        { href: '#warningNotice', text: 'Enter a warning message in English' },
        { href: '#warningNoticeCy', text: 'Enter a warning message in Welsh' },
      ],
      form: {
        warningNotice: '',
        warningNoticeCy: '',
      },
      pagePath: `/courts/${courtId}/edit/warning-notice`,
      pageTitle: 'Warning notice',
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Enter a warning message in English');
    expect(html).toContain('Enter a warning message in Welsh');
  });
});
