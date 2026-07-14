import { env } from '../../../testUtils/nunjucksHelper';

describe('Approvals View', () => {
  test('renders approvals tracker table and filter', () => {
    const html = env.render('approvals.njk', {
      approvals: [
        {
          approvalId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          approved: true,
          name: 'Reading Crown Court',
          status: 'Approved',
          approverEmail: 'approver@justice.gov.uk',
          approvedAt: '26/06/2026 10:10:11',
        },
      ],
      nameFilter: 'reading',
      isSuperAdmin: true,
      pagePath: '/approvals',
      pageTitle: 'Approvals tracker',
      statusFilter: 'approved',
    });

    expect(html).toContain('Approvals tracker');
    expect(html).toContain('Search by name');
    expect(html).toContain('Approval status');
    expect(html).toContain('All');
    expect(html).toContain('Not approved');
    expect(html).toContain('Court/service centre/tribunal name');
    expect(html).toContain('Status');
    expect(html).toContain('Email of approver');
    expect(html).toContain('Time and date of approval');
    expect(html).toContain('Reading Crown Court');
    expect(html).toContain('approver@justice.gov.uk');
    expect(html).toContain('Clear filters');
    expect(html).toContain('govuk-tag govuk-tag--green');
    expect(html).toContain('/approvals/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/undo');
  });
});
