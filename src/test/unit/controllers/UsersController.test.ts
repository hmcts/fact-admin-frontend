import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import UsersController from '../../../main/controllers/UsersController';
import { mockRequest } from '../mocks/mockRequest';

describe('UsersController', () => {
  test('renders the users view', async () => {
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
    const viewModel = {
      errorSummary: [],
      filters,
      pageTitle: 'Users',
      pagination: {
        items: [],
        totalPages: 0,
      },
      resultsMessage: 'No users found.',
      users: [],
      userTableHead: [],
      userTableRows: [],
    };
    const usersPageService = {
      getFilters: stub().returns(filters),
      getUsersPageViewModel: stub().resolves(viewModel),
    };
    const controller = new UsersController(usersPageService as never);
    const request = mockRequest({});
    request.query = { search: 'admin' };
    const response = {
      render: () => '',
    } as unknown as Response;
    const responseMock = mock(response);
    responseMock.expects('render').once().withArgs('users', viewModel);

    await controller.get(request, response);

    assert.calledWith(usersPageService.getFilters, { search: 'admin' });
    assert.calledWith(usersPageService.getUsersPageViewModel, filters);
    responseMock.verify();
  });
});
