import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
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
});
