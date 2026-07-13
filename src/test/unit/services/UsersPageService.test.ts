import { HttpStatusCode } from 'axios';

import { UsersPageFiltersService } from '../../../main/services/UsersPageFiltersService';
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
    expect(viewModel.userTableHead[3]).toEqual({ text: 'Role' });
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

  test('validates pagination and sort query params before calling the users API', async () => {
    const filtersService = new UsersPageFiltersService();

    expect(filtersService.validateFilters(filtersService.getFilters({ pageSize: '0' }))).toEqual([
      { href: '#main-content', text: 'pageSize must be greater than 0' },
    ]);
    expect(filtersService.validateFilters(filtersService.getFilters({ pageSize: '1001' }))).toEqual([
      { href: '#main-content', text: 'pageSize must be less than or equal to 1000' },
    ]);
    expect(filtersService.validateFilters(filtersService.getFilters({ pageNumber: '-1' }))).toEqual([
      { href: '#main-content', text: 'pageNumber must be greater than or equal to 0' },
    ]);
    expect(filtersService.validateFilters(filtersService.getFilters({ pageNumber: '1001' }))).toEqual([
      { href: '#main-content', text: 'pageNumber must be less than or equal to 1000' },
    ]);
    expect(filtersService.validateFilters(filtersService.getFilters({ sortOrder: 'asc' }))).toEqual([
      { href: '#main-content', text: 'sortOrder cannot be provided without sortBy' },
    ]);
    expect(filtersService.validateFilters(filtersService.getFilters({ sortBy: 'email' }))).toEqual([
      { href: '#main-content', text: 'sortBy must be one of: lastLogin' },
    ]);
    expect(
      filtersService.validateFilters(filtersService.getFilters({ sortBy: 'lastLogin', sortOrder: 'latest' }))
    ).toEqual([{ href: '#main-content', text: 'sortOrder must be one of: asc, desc' }]);
  });

  test('builds pagination with ellipses and keeps non-default page size in links', async () => {
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
      ],
      page: {
        number: 4,
        size: 10,
        totalElements: 80,
        totalPages: 8,
      },
    });
    const service = new UsersPageService({ getUsers } as never);

    const viewModel = await service.getUsersPageViewModel(service.getFilters({ pageNumber: '4', pageSize: '10' }));

    expect(viewModel.resultsMessage).toBe('Showing 41 to 41 of 80 users');
    expect(viewModel.pagination.items).toEqual([
      { current: false, href: '/users?pageSize=10&pageNumber=0', number: 1 },
      { ellipsis: true, href: '', number: -1 },
      { current: false, href: '/users?pageSize=10&pageNumber=3', number: 4 },
      { current: true, href: '/users?pageSize=10&pageNumber=4', number: 5 },
      { current: false, href: '/users?pageSize=10&pageNumber=5', number: 6 },
      { ellipsis: true, href: '', number: -1 },
      { current: false, href: '/users?pageSize=10&pageNumber=7', number: 8 },
    ]);
  });

  test('keeps blank and invalid last login values and unknown roles readable', async () => {
    const getUsers = jest.fn().mockResolvedValue({
      content: [
        {
          email: 'blank-login@example.com',
          favouriteCourts: null,
          id: '11111111-1111-4111-8111-111111111111',
          lastLogin: '',
          role: 'CUSTOM_ROLE',
          ssoId: '22222222-2222-4222-8222-222222222222',
        },
        {
          email: 'invalid-login@example.com',
          favouriteCourts: null,
          id: '33333333-3333-4333-8333-333333333333',
          lastLogin: 'not-a-date',
          role: 'SUPER_ADMIN',
          ssoId: '44444444-4444-4444-8444-444444444444',
        },
      ],
      page: {
        number: 0,
        size: 25,
        totalElements: 2,
        totalPages: 1,
      },
    });
    const service = new UsersPageService({ getUsers } as never);

    const viewModel = await service.getUsersPageViewModel(service.getFilters({}));

    expect(viewModel.userTableRows).toEqual([
      [
        { text: 'blank-login@example.com' },
        { text: '22222222-2222-4222-8222-222222222222' },
        { text: '' },
        { text: 'CUSTOM_ROLE' },
      ],
      [
        { text: 'invalid-login@example.com' },
        { text: '44444444-4444-4444-8444-444444444444' },
        { text: 'not-a-date' },
        { text: 'Super admin' },
      ],
    ]);
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
