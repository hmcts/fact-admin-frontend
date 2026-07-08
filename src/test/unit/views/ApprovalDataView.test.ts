import { env } from '../../../testUtils/nunjucksHelper';

describe('Approval Data View', () => {
  test('renders approve data confirmation page', () => {
    const html = env.render('approval-confirm.njk', {
      editPath: '/courts/11111111-1111-4111-8111-111111111111/edit',
      name: 'Reading Crown Court',
      pagePath: '/courts/11111111-1111-4111-8111-111111111111/edit/approve',
      pageTitle: 'Approve data - Reading Crown Court',
      subjectId: '11111111-1111-4111-8111-111111111111',
      subjectType: 'COURT',
    });

    expect(html).toContain('Are you sure you want to approve the data for this court/service centre/tribunal?');
    expect(html).toContain('Make sure you have checked the data in all sections before approving.');
    expect(html).toContain('Reading Crown Court');
    expect(html).toContain('Court/service centre/tribunal');
    expect(html).toContain('Confirm data');
    expect(html).toContain('Cancel');
    expect(html).toContain('action="/courts/11111111-1111-4111-8111-111111111111/edit/approve"');
    expect(html).toContain('id="cancel_form"');
    expect(html).toContain('action="/courts/11111111-1111-4111-8111-111111111111/edit"');
  });

  test('renders approve data success page', () => {
    const html = env.render('approval-success.njk', {
      editPath: '/service-centres/22222222-2222-4222-8222-222222222222/edit',
      name: 'Birmingham Service Centre',
      pagePath: '/service-centres/22222222-2222-4222-8222-222222222222/edit/approve',
      pageTitle: 'Approval saved - Birmingham Service Centre',
      subjectId: '22222222-2222-4222-8222-222222222222',
      subjectType: 'SERVICE_CENTRE',
    });

    expect(html).toContain(
      'You have approved the data for Birmingham Service Centre. If this was done in error please contact the NSU. nationalsupportunit@justice.gov.uk'
    );
    expect(html).toContain('Back to Editing - Birmingham Service Centre');
    expect(html).toContain('Back to Courts, tribunals and service centres list');
    expect(html).toContain('govuk-panel govuk-panel--confirmation');
  });
});
