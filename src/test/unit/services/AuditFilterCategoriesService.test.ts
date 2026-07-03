import { GetAuditsParams } from '../../../main/requests/types/GetAuditsParams';
import { AuditFilterCategoriesService } from '../../../main/services/AuditFilterCategoriesService';

describe('AuditFilterCategoriesService', () => {
  const service = new AuditFilterCategoriesService();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 5, 26, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('builds selected filter categories including from and to dates when from date is not today', () => {
    const filters: GetAuditsParams = {
      pageNumber: 1,
      pageSize: 25,
      email: 'admin@example.com',
      subjectType: 'COURT',
      courtId: '11111111-1111-4111-8111-111111111111',
      serviceCentreId: undefined,
      fromDate: '25/6/2026',
      toDate: '26/6/2026',
    };

    const categories = service.buildFilterCategories(filters);

    expect(categories).toEqual([
      {
        heading: { text: 'Email address' },
        items: [
          {
            text: 'Email address',
            href: '/audits?pageNumber=1&pageSize=25&subjectType=COURT&courtId=11111111-1111-4111-8111-111111111111&fromDate=25%2F6%2F2026&toDate=26%2F6%2F2026',
          },
        ],
      },
      {
        heading: { text: 'Subject' },
        items: [
          {
            text: 'Type (COURT)',
            href: '/audits?pageNumber=1&pageSize=25&email=admin%40example.com&courtId=11111111-1111-4111-8111-111111111111&fromDate=25%2F6%2F2026&toDate=26%2F6%2F2026',
          },
          {
            text: 'Court Name',
            href: '/audits?pageNumber=1&pageSize=25&email=admin%40example.com&subjectType=COURT&fromDate=25%2F6%2F2026&toDate=26%2F6%2F2026',
          },
        ],
      },
      {
        heading: { text: 'Between' },
        items: [
          {
            text: 'From date',
            href: '/audits?pageNumber=1&pageSize=25&email=admin%40example.com&subjectType=COURT&courtId=11111111-1111-4111-8111-111111111111&toDate=26%2F6%2F2026',
          },
          {
            text: 'To date',
            href: '/audits?pageNumber=1&pageSize=25&email=admin%40example.com&subjectType=COURT&courtId=11111111-1111-4111-8111-111111111111&fromDate=25%2F6%2F2026',
          },
        ],
      },
    ]);
  });

  test('hides from date when it matches today, but keeps to date under Between', () => {
    const filters: GetAuditsParams = {
      pageNumber: 0,
      pageSize: 25,
      email: undefined,
      subjectType: undefined,
      courtId: undefined,
      serviceCentreId: undefined,
      fromDate: '26/6/2026',
      toDate: '27/6/2026',
    };

    const categories = service.buildFilterCategories(filters);

    expect(categories).toEqual([
      {
        heading: { text: 'Between' },
        items: [
          {
            text: 'To date',
            href: '/audits?pageNumber=0&pageSize=25&fromDate=26%2F6%2F2026',
          },
        ],
      },
    ]);
  });

  test('formats subject type with readable spacing', () => {
    const filters: GetAuditsParams = {
      pageNumber: 0,
      pageSize: 25,
      email: undefined,
      subjectType: 'SERVICE_CENTRE',
      courtId: undefined,
      serviceCentreId: '22222222-2222-4222-8222-222222222222',
      fromDate: '25/6/2026',
      toDate: undefined,
    };

    const categories = service.buildFilterCategories(filters);
    const subjectCategory = categories.find(category => category.heading.text === 'Subject');

    expect(subjectCategory).toEqual({
      heading: { text: 'Subject' },
      items: [
        {
          text: 'Type (SERVICE CENTRE)',
          href: '/audits?pageNumber=0&pageSize=25&serviceCentreId=22222222-2222-4222-8222-222222222222&fromDate=25%2F6%2F2026',
        },
        {
          text: 'Service Centre Name',
          href: '/audits?pageNumber=0&pageSize=25&subjectType=SERVICE_CENTRE&fromDate=25%2F6%2F2026',
        },
      ],
    });
  });
});
