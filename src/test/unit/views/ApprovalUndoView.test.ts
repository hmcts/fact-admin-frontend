import { env } from '../../../testUtils/nunjucksHelper';

describe('Approval Undo Views', () => {
  test('renders undo approval confirmation page', () => {
    const html = env.render('approval-undo-confirm.njk', {
      approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      name: 'Reading Crown Court',
      pagePath: '/approvals/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/undo',
      pageTitle: 'Undo approval - Reading Crown Court',
    });

    expect(html).toContain('Are you sure you want to undo the data approval for this court/service centre/tribunal?');
    expect(html).toContain('Reading Crown Court');
    expect(html).toContain('Undo approval');
    expect(html).toContain('Cancel');
  });

  test('renders undo approval success page', () => {
    const html = env.render('common-edit-success.njk', {
      continueUpdatingHref: '/approvals',
      continueUpdatingText: 'Back to Approval tracker',
      homeText: 'Back to Courts, tribunals and service centres list',
      pagePath: '/approvals/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/undo',
      pageTitle: 'Approval undone - Reading Crown Court',
      successPanelBody: 'You have undone the data approval for Reading Crown Court.',
      successPanelTitle: 'Approval undone',
    });

    expect(html).toContain('You have undone the data approval for Reading Crown Court.');
    expect(html).toContain('Back to Approval tracker');
    expect(html).toContain('Back to Courts, tribunals and service centres list');
  });
});
