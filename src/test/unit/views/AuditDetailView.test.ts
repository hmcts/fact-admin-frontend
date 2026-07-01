import { env } from '../../../testUtils/nunjucksHelper';

describe('Audit Detail View', () => {
  test('renders the summary details and change log for non-delete actions', () => {
    const html = env.render('audit-detail.njk', {
      audit: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        subjectName: 'Audit Detail Court',
        userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        user: {
          email: 'super-admin@example.com',
          favouriteCourts: null,
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          lastLogin: '2026-06-26T09:10:11.123Z',
          role: 'SUPER_ADMIN',
          ssoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        },
        actionType: 'UPDATE',
        actionEntity: 'court',
        actionDataDiff: [
          {
            field: 'name',
            oldValue: 'Audit Detail Court',
            newValue: 'Audit Detail Court Updated',
          },
        ],
        createdAt: '26/06/2026 09:10:11.123',
      },
      pagePath: '/audits/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      pageTitle: 'Audit Detail',
    });

    expect(html).toContain('Audit Detail');
    expect(html).toContain('UPDATE');
    expect(html).toContain('Audit Detail Court:  court');
    expect(html).toContain('Change Log');
    expect(html).toContain('Audit Detail Court Updated');
  });

  test('does not render the change log section for delete actions', () => {
    const html = env.render('audit-detail.njk', {
      audit: {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectType: 'COURT',
        subjectName: 'Audit Detail Court',
        userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        user: {
          email: 'super-admin@example.com',
          favouriteCourts: null,
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          lastLogin: '2026-06-26T09:10:11.123Z',
          role: 'SUPER_ADMIN',
          ssoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        },
        actionType: 'DELETE',
        actionEntity: 'court address',
        actionDataDiff: null,
        createdAt: '26/06/2026 09:10:11.123',
      },
      pagePath: '/audits/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      pageTitle: 'Audit Detail',
    });

    expect(html).toContain('DELETE');
    expect(html).not.toContain('Change Log');
  });
});
