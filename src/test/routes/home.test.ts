import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { HomePageService } from '../../main/services/HomePageService';

describe('Home page', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the homepage', async () => {
    stub(HomePageService.prototype, 'getFilters').returns({
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
    stub(HomePageService.prototype, 'getHomePageViewModel').resolves({
      courtTableHead: [],
      courtTableRows: [],
      errorSummary: [],
      filters: {
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
      },
      includeStatusColumn: false,
      pageTitle: 'Courts and tribunals',
      pagination: {
        currentPage: 0,
        items: [],
        totalPages: 0,
      },
      partialCourtNameError: undefined,
      regionOptions: [{ selected: true, text: 'All regions', value: '' }],
      resultsMessage: 'No courts found.',
    });

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Courts and tribunals');
    expect(response.text).toContain('Apply filters');
  });
});
