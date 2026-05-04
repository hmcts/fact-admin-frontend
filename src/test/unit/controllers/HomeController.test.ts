import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import HomeController from '../../../main/controllers/HomeController';
import { HomePageService } from '../../../main/services/HomePageService';
import { mockRequest } from '../mocks/mockRequest';

describe('HomeController', () => {
  test('renders the home view', async () => {
    const controller = new HomeController();
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    const responseMock = mock(response);
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
    const viewModel = {
      courtTableHead: [],
      courtTableRows: [],
      errorSummary: [],
      filters,
      includeStatusColumn: false,
      pagination: {
        currentPage: 0,
        items: [],
        totalPages: 0,
      },
      pageTitle: 'Courts and tribunals',
      partialCourtNameError: undefined,
      regionOptions: [],
      resultsMessage: 'No courts found.',
    };
    const getFiltersStub = stub(HomePageService.prototype, 'getFilters').returns(filters);
    const getHomePageViewModelStub = stub(HomePageService.prototype, 'getHomePageViewModel').resolves(viewModel);

    responseMock.expects('render').once().withArgs('home', viewModel);

    try {
      await controller.get(request, response);
      assert.calledOnce(getFiltersStub);
      assert.calledOnce(getHomePageViewModelStub);
      responseMock.verify();
    } finally {
      getFiltersStub.restore();
      getHomePageViewModelStub.restore();
    }
  });
});
