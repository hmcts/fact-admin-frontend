import { HttpStatusCode } from 'axios';

import { UsersPageService } from '../../../main/services/UsersPageService';

describe('UsersPageService', () => {
  test('parses users page filters from query values', () => {
    const service = new UsersPageService({ getUsers: jest.fn() } as never);

    const filters = service.getFilters({
      pageNumber: '2',
      pageSize: '10',
      search: 'admin',
      sortBy: 'lastLogin',
      sortOrder: 'desc',
    });

    expect(filters).toEqual({
      pageNumber: 2,
      pageSize: 10,
      rawPageNumber: '2',
      rawPageSize: '10',
      rawSearch: 'admin',
      rawSortBy: 'lastLogin',
      rawSortOrder: 'desc',
      search: 'admin',
      sortBy: 'lastLogin',
      sortOrder: 'desc',
    });
  });

  test('builds the users page view model from the API response', async () => {
    const getUsers = jest.fn().mockResolvedValue({
      content: [
        {
          email: 'admin@example.com',
          favouriteCourts: null,
          id: '11111111-1111-4111-8111-111111111111',
          lastLogin: '2026-07-08T09:30:00Z',
          role: 'ADMIN',
          ssoId: '22222222-2222-4222-8222-222222222222',
        },
        {
          email: 'super-admin@example.com',
          favouriteCourts: null,
          id: '33333333-3333-4333-8333-333333333333',
          lastLogin: '2026-07-07T09:30:00Z',
          role: 'SuperAdmin',
          ssoId: '44444444-4444-4444-8444-444444444444',
        },
      ],
      page: {
        number: 0,
        size: 25,
        totalElements: 30,
        totalPages: 2,
      },
    });
    const service = new UsersPageService({ getUsers } as never);

    const viewModel = await service.getUsersPageViewModel(service.getFilters({ search: 'admin' }));

    expect(getUsers).toHaveBeenCalledWith({
      pageNumber: 0,
      pageSize: 25,
      search: 'admin',
    });
    expect(viewModel.pageTitle).toBe('Users (page 1 of 2)');
    expect(viewModel.resultsMessage).toBe('Showing 1 to 2 of 30 users');
    expect(viewModel.userTableHead).toHaveLength(4);
    expect(viewModel.userTableHead[0]).toEqual({ text: 'Email' });
    expect(viewModel.userTableHead[1]).toEqual({ text: 'SSO ID' });
    expect(viewModel.userTableHead[2].html).toContain('Last login');
    expect(viewModel.userTableHead[3]).toEqual({ text: 'Role(s)' });
    expect(viewModel.userTableRows).toEqual([
      [
        { text: 'admin@example.com' },
        { text: '22222222-2222-4222-8222-222222222222' },
        { text: '8 Jul 2026, 10:30' },
        { text: 'Admin' },
      ],
      [
        { text: 'super-admin@example.com' },
        { text: '44444444-4444-4444-8444-444444444444' },
        { text: '7 Jul 2026, 10:30' },
        { text: 'Super admin' },
      ],
    ]);
    expect(viewModel.pagination.next).toEqual({ href: '/users?search=admin&pageNumber=1' });
  });

  test('passes last login sort params to the users API and preserves them in pagination', async () => {
    const getUsers = jest.fn().mockResolvedValue({
      content: [],
      page: {
        number: 1,
        size: 25,
        totalElements: 50,
        totalPages: 2,
      },
    });
    const service = new UsersPageService({ getUsers } as never);
    const filters = service.getFilters({
      pageNumber: '1',
      search: 'admin',
      sortBy: 'lastLogin',
      sortOrder: 'desc',
    });

    const viewModel = await service.getUsersPageViewModel(filters);

    expect(getUsers).toHaveBeenCalledWith({
      pageNumber: 1,
      pageSize: 25,
      search: 'admin',
      sortBy: 'lastLogin',
      sortOrder: 'desc',
    });
    expect(viewModel.pagination.previous).toEqual({
      href: '/users?search=admin&sortBy=lastLogin&sortOrder=desc&pageNumber=0',
    });
    expect(viewModel.userTableHead[2]).toEqual({
      attributes: { 'aria-sort': 'descending' },
      html: expect.stringContaining('sort ascending'),
    });
  });

  test('does not call the users API when filters fail validation', async () => {
    const getUsers = jest.fn();
    const service = new UsersPageService({ getUsers } as never);

    const viewModel = await service.getUsersPageViewModel(service.getFilters({ search: 'not valid' }));

    expect(getUsers).not.toHaveBeenCalled();
    expect(viewModel.pageTitle).toBe('Error: Users');
    expect(viewModel.searchError).toBe(
      'Search must only include letters, numbers, @ symbols, dots, underscores, plus signs and hyphens.'
    );
    expect(viewModel.userTableRows).toEqual([]);
  });

  test('returns an empty table and error message when the users API fails', async () => {
    const service = new UsersPageService({
      getUsers: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    } as never);

    const viewModel = await service.getUsersPageViewModel(service.getFilters({}));

    expect(viewModel.errorMessage).toBe('There was a problem loading users.');
    expect(viewModel.resultsMessage).toBe('No users found.');
    expect(viewModel.userTableRows).toEqual([]);
  });
});
