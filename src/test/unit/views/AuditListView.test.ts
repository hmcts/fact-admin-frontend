import { env } from '../../../testUtils/nunjucksHelper';

describe('Audit List View', () => {
  test('renders audits table and download button', () => {
    const html = env.render('audit-list.njk', {
      audits: {
        content: [
          {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            subjectId: '11111111-1111-4111-8111-111111111111',
            subjectType: 'COURT',
            subjectName: 'Audit View Test Court',
            userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            user: {
              email: 'super-admin@example.com',
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
        ],
        page: {
          number: 1,
          size: 25,
          totalElements: 1,
          totalPages: 1,
        },
      },
      basePagerUrl: '/audits?pageNumber=',
      downloadUrl: '/audits/download?subjectType=COURT',
      errors: undefined,
      filterCategories: [],
      pagePath: '/audits',
      filters: {
        pageNumber: 1,
        pageSize: 25,
        email: undefined,
        subjectType: 'COURT',
        courtId: '11111111-1111-4111-8111-111111111111',
        serviceCentreId: undefined,
        fromDate: '26/6/2026',
        toDate: undefined,
      },
      pageTitle: 'Audits',
      subjects: new Map([['COURT', new Map([['11111111-1111-4111-8111-111111111111', 'Audit View Test Court']])]]),
    });

    expect(html).toContain('Audits');
    expect(html).toContain('Audit View Test Court:  court address');
    expect(html).toContain('DELETE');
    expect(html).toContain('Download CSV');
    expect(html).toContain('/audits/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  });

  test('renders the invalid-filter empty state when errors are present', () => {
    const html = env.render('audit-list.njk', {
      audits: {
        content: [],
        page: {
          number: 1,
          size: 25,
          totalElements: 0,
          totalPages: 0,
        },
      },
      basePagerUrl: '/audits?pageNumber=',
      downloadUrl: undefined,
      errors: {
        email: ['Email is invalid'],
      },
      filterCategories: [],
      pagePath: '/audits',
      filters: {
        pageNumber: 1,
        pageSize: 25,
        email: 'bad@@@',
        subjectType: undefined,
        courtId: undefined,
        serviceCentreId: undefined,
        fromDate: '26/6/2026',
        toDate: undefined,
      },
      pageTitle: 'Error: Audits',
      subjects: new Map([
        ['COURT', new Map()],
        ['SERVICE_CENTRE', new Map()],
      ]),
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('No audits returned; there is an unresolved issue with the search parameters.');
    expect(html).toContain('Error: Audits');
  });
});
