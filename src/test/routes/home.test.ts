import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { HomePageService } from '../../main/services/HomePageService';

function stubHomePage(): void {
  const filters = {
    activeTab: 'courts' as const,
    favouritesPageNumber: 0,
    includeClosed: false,
    onlyServiceCentres: false,
    pageNumber: 0,
    pageSize: 25,
    partialCourtName: '',
    regionId: '',
    sortBy: '',
    sortOrder: 'asc',
    rawIncludeClosed: undefined,
    rawFavouritesPageNumber: undefined,
    rawOnlyServiceCentres: undefined,
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
    favouriteTableHead: [],
    favouriteTableRows: [],
    favouritesPagination: {
      currentPage: 0,
      items: [],
      totalPages: 0,
    },
    favouritesResultsMessage: 'No favourite courts, tribunals or service centres found.',
    filters,
    includeStatusColumn: false,
    pageTitle: 'Courts, tribunals and service centres',
    pagination: {
      currentPage: 0,
      items: [],
      totalPages: 0,
    },
    partialCourtNameError: undefined,
    regionOptions: [{ selected: true, text: 'All regions', value: '' }],
    resultsMessage: 'No courts, tribunals or service centres found.',
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
    expect(response.text).toContain('Courts, tribunals and service centres');
    expect(response.text).toContain('govuk-tabs homepage-tabs');
    expect(response.text).toContain('Favourites');
    expect(response.text).toContain('Apply filters');
    expect(response.text).toContain('Download csv');
    expect(response.text).toContain('Add new court');
    expect(response.text).toContain('Add new service centre');
    expect(response.text).toContain('Approvals tracker');
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
