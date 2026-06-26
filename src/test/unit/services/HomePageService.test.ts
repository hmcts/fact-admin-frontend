import { HttpStatusCode } from 'axios';

import { HomePageService } from '../../../main/services/HomePageService';

describe('HomePageService', () => {
  test('parses homepage filters from query values', () => {
    const service = new HomePageService({
      getCourts: jest.fn(),
      getRegions: jest.fn(),
    } as never);

    const filters = service.getFilters({
      includeClosed: 'true',
      pageNumber: '2',
      pageSize: '10',
      partialCourtName: 'London',
      regionId: '11111111-1111-4111-8111-111111111111',
      sortBy: 'name',
      sortOrder: 'desc',
    });

    expect(filters).toEqual({
      includeClosed: true,
      pageNumber: 2,
      pageSize: 10,
      partialCourtName: 'London',
      regionId: '11111111-1111-4111-8111-111111111111',
      sortBy: 'name',
      sortOrder: 'desc',
      rawIncludeClosed: 'true',
      rawPageNumber: '2',
      rawPageSize: '10',
      rawSortBy: 'name',
      rawSortOrder: 'desc',
    });
  });

  test('caps pageNumber and pageSize at 1000 when query values exceed the backend integer limit', () => {
    const service = new HomePageService({
      getCourts: jest.fn(),
      getRegions: jest.fn(),
    } as never);

    const filters = service.getFilters({
      pageNumber: '999999999999999999999',
      pageSize: '999999999999999999999',
    });

    expect(filters).toEqual({
      includeClosed: false,
      pageNumber: 1000,
      pageSize: 1000,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: '999999999999999999999',
      rawPageSize: '999999999999999999999',
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });
  });

  test('defaults sortOrder to ascending when sortBy is provided without sortOrder', () => {
    const service = new HomePageService({
      getCourts: jest.fn(),
      getRegions: jest.fn(),
    } as never);

    const filters = service.getFilters({
      sortBy: 'lastUpdated',
    });

    expect(filters.sortBy).toBe('lastUpdated');
    expect(filters.sortOrder).toBe('asc');
  });

  test('builds the homepage view model from API responses', async () => {
    const service = new HomePageService({
      getCourts: jest.fn().mockResolvedValue({
        content: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            lastUpdatedAt: '2026-04-29T10:00:00Z',
            name: 'London Civil and Family Court',
            open: true,
            regionId: '11111111-1111-4111-8111-111111111111',
            slug: 'london-civil-and-family-court',
          },
        ],
        page: {
          number: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
        },
      }),
      getRegions: jest.fn().mockResolvedValue([
        {
          country: 'England',
          id: '11111111-1111-4111-8111-111111111111',
          name: 'London',
        },
      ]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(viewModel.courtTableHead).toEqual([
      {
        attributes: { 'aria-sort': 'none' },
        html: '<a class="homepage-sort-link govuk-link govuk-link--no-visited-state" href="/?sortBy=name&sortOrder=asc&pageNumber=0">Name<svg class="homepage-sort-icon" width="22" height="22" focusable="false" aria-hidden="true" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.1875 9.5L10.9609 3.95703L13.7344 9.5H8.1875Z" fill="currentColor"/><path d="M13.7344 12.0781L10.9609 17.6211L8.1875 12.0781H13.7344Z" fill="currentColor"/></svg><span class="govuk-visually-hidden">, sort ascending</span></a>',
      },
      {
        attributes: { 'aria-sort': 'none' },
        html: '<a class="homepage-sort-link govuk-link govuk-link--no-visited-state" href="/?sortBy=lastUpdated&sortOrder=asc&pageNumber=0">Last updated<svg class="homepage-sort-icon" width="22" height="22" focusable="false" aria-hidden="true" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.1875 9.5L10.9609 3.95703L13.7344 9.5H8.1875Z" fill="currentColor"/><path d="M13.7344 12.0781L10.9609 17.6211L8.1875 12.0781H13.7344Z" fill="currentColor"/></svg><span class="govuk-visually-hidden">, sort ascending</span></a>',
      },
      { classes: 'homepage-courts-table__actions', text: 'Actions' },
    ]);
    expect(viewModel.errorMessage).toBeUndefined();
    expect(viewModel.errorSummary).toEqual([]);
    expect(viewModel.includeStatusColumn).toBe(false);
    expect(viewModel.pageTitle).toBe('Courts and tribunals');
    expect(viewModel.partialCourtNameError).toBeUndefined();
    expect(viewModel.resultsMessage).toBe('Showing 1 to 1 of 1 courts');
    expect(viewModel.regionOptions).toEqual([
      { selected: true, text: 'All regions', value: '' },
      {
        selected: false,
        text: 'London',
        value: '11111111-1111-4111-8111-111111111111',
      },
    ]);
    expect(viewModel.courtTableRows).toEqual([
      [
        { text: 'London Civil and Family Court' },
        { text: '29 Apr 2026' },
        {
          classes: 'homepage-courts-table__actions',
          html: '<ul class="govuk-summary-list__actions-list govuk-!-margin-bottom-0"><li class="govuk-summary-list__actions-list-item"><a class="govuk-link govuk-link--no-visited-state" href="https://localhost:3344/courts/london-civil-and-family-court">View<span class="govuk-visually-hidden"> London Civil and Family Court</span></a></li><li class="govuk-summary-list__actions-list-item"><a class="govuk-link govuk-link--no-visited-state" href="/courts/22222222-2222-4222-8222-222222222222/edit">Edit<span class="govuk-visually-hidden"> London Civil and Family Court</span></a></li></ul>',
        },
      ],
    ]);
  });

  test('passes sort params to the courts API and preserves them in pagination and headers', async () => {
    const getCourts = jest.fn().mockResolvedValue({
      content: [],
      page: {
        number: 1,
        size: 25,
        totalElements: 50,
        totalPages: 3,
      },
    });
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 1,
      pageSize: 25,
      partialCourtName: 'London',
      regionId: '',
      sortBy: 'name',
      sortOrder: 'desc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: 'name',
      rawSortOrder: 'desc',
    });

    expect(getCourts).toHaveBeenCalledWith({
      includeClosed: false,
      pageNumber: 1,
      pageSize: 25,
      partialCourtName: 'London',
      sortBy: 'name',
      sortOrder: 'desc',
    });
    expect(viewModel.courtTableHead[0]).toEqual({
      attributes: { 'aria-sort': 'descending' },
      html: '<a class="homepage-sort-link govuk-link govuk-link--no-visited-state" href="/?partialCourtName=London&sortBy=name&sortOrder=asc&pageNumber=0">Name<svg class="homepage-sort-icon" width="22" height="22" focusable="false" aria-hidden="true" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.4375 7L11 15.8687L6.5625 7L15.4375 7Z" fill="currentColor"/></svg><span class="govuk-visually-hidden">, sort ascending</span></a>',
    });
    expect(viewModel.pagination.next).toEqual({
      href: '/?partialCourtName=London&sortBy=name&sortOrder=desc&pageNumber=2',
    });
    expect(viewModel.pagination.previous).toEqual({
      href: '/?partialCourtName=London&sortBy=name&sortOrder=desc&pageNumber=0',
    });
  });

  test('returns an error message and empty data when requests fail', async () => {
    const service = new HomePageService({
      getCourts: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      getRegions: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(viewModel.errorMessage).toBe('There was a problem loading regions and courts.');
    expect(viewModel.errorSummary).toEqual([]);
    expect(viewModel.courtTableRows).toEqual([]);
    expect(viewModel.resultsMessage).toBe('No courts found.');
  });

  test('builds condensed pagination and page title for later pages', async () => {
    const service = new HomePageService({
      getCourts: jest.fn().mockResolvedValue({
        content: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            lastUpdatedAt: '2026-04-29T10:00:00Z',
            name: 'London Civil and Family Court',
            open: true,
            regionId: '11111111-1111-4111-8111-111111111111',
            slug: 'london-civil-and-family-court',
          },
        ],
        page: {
          number: 4,
          size: 25,
          totalElements: 250,
          totalPages: 10,
        },
      }),
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: true,
      pageNumber: 4,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(viewModel.includeStatusColumn).toBe(true);
    expect(viewModel.pageTitle).toBe('Courts and tribunals (page 5 of 10)');
    expect(viewModel.pagination).toEqual({
      currentPage: 4,
      items: [
        { current: false, href: '/?includeClosed=true&pageNumber=0', number: 1 },
        { ellipsis: true, href: '', number: -1 },
        { current: false, href: '/?includeClosed=true&pageNumber=3', number: 4 },
        { current: true, href: '/?includeClosed=true&pageNumber=4', number: 5 },
        { current: false, href: '/?includeClosed=true&pageNumber=5', number: 6 },
        { ellipsis: true, href: '', number: -1 },
        { current: false, href: '/?includeClosed=true&pageNumber=9', number: 10 },
      ],
      next: { href: '/?includeClosed=true&pageNumber=5' },
      previous: { href: '/?includeClosed=true&pageNumber=3' },
      totalPages: 10,
    });
  });

  test('returns GOV.UK validation errors for an invalid partial court name and skips the courts call', async () => {
    const getCourts = jest.fn();
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: 'London 123',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(getCourts).not.toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([
      {
        href: '#partialCourtName',
        text: 'Court or tribunal name must only include letters, spaces, brackets, apostrophes, hyphens and ampersands.',
      },
    ]);
  });

  test('returns a GOV.UK error summary for invalid pageSize and skips the courts call', async () => {
    const getCourts = jest.fn();
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: '0',
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(getCourts).not.toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([
      {
        href: '#main-content',
        text: 'pageSize must be greater than 0',
      },
    ]);
  });

  test('returns a GOV.UK error summary for pageSize values above 1000 and skips the courts call', async () => {
    const getCourts = jest.fn();
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 1000,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: '1001',
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(getCourts).not.toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([
      {
        href: '#main-content',
        text: 'pageSize must be less than or equal to 1000',
      },
    ]);
  });

  test('returns a GOV.UK error summary for invalid pageNumber and skips the courts call', async () => {
    const getCourts = jest.fn();
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: '-1',
      rawPageSize: undefined,
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(getCourts).not.toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([
      {
        href: '#main-content',
        text: 'pageNumber must be greater than or equal to 0',
      },
    ]);
  });

  test('returns a GOV.UK error summary for pageNumber values above 1000 and skips the courts call', async () => {
    const getCourts = jest.fn();
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 1000,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: '1001',
      rawPageSize: undefined,
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(getCourts).not.toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([
      {
        href: '#main-content',
        text: 'pageNumber must be less than or equal to 1000',
      },
    ]);
  });

  test('accepts includeClosed=false without validation errors', async () => {
    const getCourts = jest.fn().mockResolvedValue({
      content: [],
      page: {
        number: 0,
        size: 25,
        totalElements: 0,
        totalPages: 0,
      },
    });
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: 'false',
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(getCourts).toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([]);
  });

  test('returns a GOV.UK error summary for invalid includeClosed and skips the courts call', async () => {
    const getCourts = jest.fn();
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: 'maybe',
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(getCourts).not.toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([
      {
        href: '#main-content',
        text: 'includeClosed must be true or false',
      },
    ]);
  });

  test('returns a field error for invalid regionId format and skips the courts call', async () => {
    const getCourts = jest.fn();
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: 'not-a-uuid',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(getCourts).not.toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([
      {
        href: '#regionId',
        text: 'Region must be a valid UUID',
      },
    ]);
  });

  test('returns a field error for unknown regionId and skips the courts call', async () => {
    const getCourts = jest.fn();
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([
        {
          country: 'England',
          id: '11111111-1111-4111-8111-111111111111',
          name: 'London',
        },
      ]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '22222222-2222-4222-8222-222222222222',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: undefined,
      rawSortOrder: undefined,
    });

    expect(getCourts).not.toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([
      {
        href: '#regionId',
        text: 'Region must be a valid region',
      },
    ]);
  });

  test('returns a validation error when sortOrder is provided without sortBy', async () => {
    const getCourts = jest.fn();
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'desc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: undefined,
      rawSortOrder: 'desc',
    });

    expect(getCourts).not.toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([
      {
        href: '#main-content',
        text: 'sortOrder cannot be provided without sortBy',
      },
    ]);
  });

  test('returns a validation error for invalid sortBy', async () => {
    const getCourts = jest.fn();
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: 'courtName',
      rawSortOrder: undefined,
    });

    expect(getCourts).not.toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([
      {
        href: '#main-content',
        text: 'sortBy must be one of: lastUpdated, name',
      },
    ]);
  });

  test('returns a validation error for invalid sortOrder', async () => {
    const getCourts = jest.fn();
    const service = new HomePageService({
      getCourts,
      getRegions: jest.fn().mockResolvedValue([]),
    } as never);

    const viewModel = await service.getHomePageViewModel({
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: 'name',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSortBy: 'name',
      rawSortOrder: 'down',
    });

    expect(getCourts).not.toHaveBeenCalled();
    expect(viewModel.errorSummary).toEqual([
      {
        href: '#main-content',
        text: 'sortOrder must be one of: asc, desc',
      },
    ]);
  });
});
