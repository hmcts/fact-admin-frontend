import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { HomePageService } from '../../main/services/HomePageService';

function stubHomePage(): void {
  const filters = {
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
  };

  stub(HomePageService.prototype, 'getFilters').returns(filters);
  stub(HomePageService.prototype, 'getHomePageViewModel').resolves({
    courtTableHead: [],
    courtTableRows: [],
    errorSummary: [],
    filters,
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
}

describe('Home page', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the homepage', async () => {
    stubHomePage();

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Courts and tribunals');
    expect(response.text).toContain('Apply filters');
    expect(response.text).toContain('Download csv');
    expect(response.text).toContain('Add new court');
    expect(response.text).not.toContain('Audit');
    expect(response.text).not.toContain('Users');
  });

  test('renders super admin navigation for super admin users', async () => {
    stubHomePage();

    const response = await request(app).get('/').set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Audit');
    expect(response.text).toContain('Users');
  });

  test('redirects unauthenticated users to sign in', async () => {
    const response = await request(app).get('/').set('x-test-unauthenticated', 'true');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/sso/login');
  });
});
