import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';
import request from 'supertest';

import { app } from '../../main/app';
import { UsersPageService } from '../../main/services/UsersPageService';

describe('Users routes', () => {
  beforeEach(() => {
    restore();
  });

  test('renders the users page for super admin users', async () => {
    const filters = {
      pageNumber: 0,
      pageSize: 25,
      rawPageNumber: undefined,
      rawPageSize: undefined,
      rawSearch: 'admin',
      rawSortBy: undefined,
      rawSortOrder: undefined,
      search: 'admin',
      sortBy: '' as const,
      sortOrder: 'asc' as const,
    };

    stub(UsersPageService.prototype, 'getFilters').returns(filters);
    stub(UsersPageService.prototype, 'getUsersPageViewModel').resolves({
      errorSummary: [],
      filters,
      pageTitle: 'Users',
      pagination: {
        items: [
          {
            current: true,
            href: '/users?search=admin&pageNumber=0',
            number: 1,
          },
          {
            href: '/users?search=admin&pageNumber=1',
            number: 2,
          },
        ],
        next: {
          href: '/users?search=admin&pageNumber=1',
        },
        totalPages: 2,
      },
      resultsMessage: 'Showing 1 to 1 of 2 users',
      users: [],
      userTableHead: [{ text: 'Email' }, { text: 'SSO ID' }, { text: 'Last login' }, { text: 'Role' }],
      userTableRows: [
        [
          { text: 'admin@example.com' },
          { text: '11111111-1111-4111-8111-111111111111' },
          { text: '8 Jul 2026, 10:30' },
          { text: 'Admin' },
        ],
      ],
    });

    const response = await request(app).get('/users?search=admin').set('x-test-role', 'SuperAdmin');

    expect(response.status).toBe(HttpStatusCode.Ok);
    expect(response.text).toContain('Users');
    expect(response.text).toContain('Search by email or SSO ID');
    expect(response.text).toContain('Email');
    expect(response.text).toContain('SSO ID');
    expect(response.text).toContain('Last login');
    expect(response.text).toContain('Role');
    expect(response.text).toContain('admin@example.com');
    expect(response.text).toContain('Next');
  });
});
