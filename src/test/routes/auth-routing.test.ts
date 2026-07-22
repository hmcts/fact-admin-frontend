import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { DataApiRequests } from '../../main/requests/DataApiRequests';
import { ApprovalService } from '../../main/services/ApprovalService';
import { HomePageService } from '../../main/services/HomePageService';
import { UsersPageService } from '../../main/services/UsersPageService';

const emptyUsersFilters = {
  pageNumber: 0,
  pageSize: 25,
  rawPageNumber: undefined,
  rawPageSize: undefined,
  rawSearch: undefined,
  rawSortBy: undefined,
  rawSortOrder: undefined,
  search: '',
  sortBy: '' as const,
  sortOrder: 'asc' as const,
};

describe('Authentication routing', () => {
  beforeEach(() => {
    restore();
  });

  test('keeps health routes public', async () => {
    const response = await request(app).get('/health/liveness').set('x-test-unauthenticated', 'true');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'UP' });
  });

  test('redirects unauthenticated users from protected routes', async () => {
    const response = await request(app).get('/users').set('x-test-unauthenticated', 'true');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/sso/login');
  });

  test('denies admin users access to super admin routes', async () => {
    const response = await request(app).get('/users').set('x-test-role', 'Admin');

    expect(response.status).toBe(403);
    expect(response.text).toContain('Access Denied');
  });

  test('allows super admin users to access super admin routes', async () => {
    stub(UsersPageService.prototype, 'getFilters').returns(emptyUsersFilters);
    stub(UsersPageService.prototype, 'getUsersPageViewModel').resolves({
      errorSummary: [],
      filters: emptyUsersFilters,
      pageTitle: 'Users',
      pagination: {
        items: [],
        totalPages: 0,
      },
      resultsMessage: 'No users found.',
      users: [],
      userTableHead: [],
      userTableRows: [],
    });

    const response = await request(app).get('/users').set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Users');
  });

  test('allows admin users to access approval routes', async () => {
    stub(ApprovalService.prototype, 'getApprovalsTracker').resolves({
      approvals: [],
      nameFilter: '',
      pageTitle: 'Approvals tracker',
      statusFilter: '',
    });

    const response = await request(app).get('/approvals').set('x-test-role', 'Admin');

    expect(response.status).toBe(200);
  });

  test('allows viewer users to access the location list', async () => {
    stub(HomePageService.prototype, 'getFilters').returns({
      includeClosed: false,
      onlyServiceCentres: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
    });
    stub(HomePageService.prototype, 'getHomePageViewModel').resolves({
      courtTableHead: [],
      courtTableRows: [],
      errorSummary: [],
      filters: {
        includeClosed: false,
        onlyServiceCentres: false,
        pageNumber: 0,
        pageSize: 25,
        partialCourtName: '',
        regionId: '',
        sortBy: '',
        sortOrder: 'asc',
      },
      includeStatusColumn: false,
      pageTitle: 'Courts, tribunals and service centres',
      pagination: { currentPage: 0, items: [], totalPages: 0 },
      regionOptions: [],
      resultsMessage: 'No courts, tribunals or service centres found.',
    });

    const response = await request(app).get('/').set('x-test-role', 'Viewer');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Locations');
    expect(response.text).not.toContain('Download csv');
    expect(response.text).not.toContain('Approvals tracker');
  });

  test('allows viewer users to access safe service centre review pages', async () => {
    stub(DataApiRequests.prototype, 'getServiceCentreAddressDetails').resolves([]);
    stub(DataApiRequests.prototype, 'getServiceCentreById').resolves({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Reading Service Centre',
      pageTitle: 'General - Reading Service Centre',
      leftColumnServiceAreaItems: [],
      rightColumnServiceAreaItems: [],
      serviceAreaIds: [],
      open: true,
    });

    const response = await request(app)
      .get('/service-centres/22222222-2222-4222-8222-222222222222/edit/address')
      .set('x-test-role', 'Viewer');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Address - Reading Service Centre');
  });

  test.each(['/download', '/add-court', '/add-service-centre', '/approvals', '/audits', '/users'])(
    'denies viewer users access to %s',
    async path => {
      const response = await request(app).get(path).set('x-test-role', 'Viewer');

      expect(response.status).toBe(403);
      expect(response.text).toContain('Access Denied');
    }
  );

  test.each([
    '/courts/11111111-1111-4111-8111-111111111111/edit/address/find',
    '/courts/11111111-1111-4111-8111-111111111111/edit/contact-details/add',
    '/courts/11111111-1111-4111-8111-111111111111/edit/contact-details/delete/22222222-2222-4222-8222-222222222222',
    '/courts/11111111-1111-4111-8111-111111111111/edit/court-opening-hours/add',
  ])('denies viewer users access to mutation workflow %s', async path => {
    const response = await request(app).get(path).set('x-test-role', 'Viewer');

    expect(response.status).toBe(403);
    expect(response.text).toContain('Access Denied');
  });

  test('denies viewer users non-approval posts', async () => {
    const response = await request(app)
      .post('/courts/11111111-1111-4111-8111-111111111111/edit/general/success')
      .set('x-test-role', 'Viewer');

    expect(response.status).toBe(403);
    expect(response.text).toContain('Access Denied');
  });
});
