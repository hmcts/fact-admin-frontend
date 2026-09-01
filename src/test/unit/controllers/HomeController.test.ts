import type { Response } from 'express';
import { assert, mock, stub } from 'sinon';

import HomeController from '../../../main/controllers/HomeController';
import { HomePageService } from '../../../main/services/HomePageService';
import { mockRequest } from '../mocks/mockRequest';

describe('HomeController', () => {
  let homePageService = new HomePageService();
  let controller = new HomeController(homePageService);

  beforeEach(() => {
    homePageService = new HomePageService();
    controller = new HomeController(homePageService);
  });

  test('renders the home view', async () => {
    const response = {
      render: () => '',
    } as unknown as Response;
    const request = mockRequest({});
    const responseMock = mock(response);
    const filters = {
      includeClosed: false,
      onlyServiceCentres: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: '',
      regionId: '',
      sortBy: '',
      sortOrder: 'asc',
      rawIncludeClosed: undefined,
      rawOnlyServiceCentres: undefined,
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
      pageTitle: 'Courts, tribunals and service centres',
      partialCourtNameError: undefined,
      regionOptions: [],
      resultsMessage: 'No courts, tribunals or service centres found.',
    };
    const getFiltersStub = stub(homePageService, 'getFilters').returns(filters);
    const getHomePageViewModelStub = stub(homePageService, 'getHomePageViewModel').resolves(viewModel);

    responseMock.expects('render').once().withArgs('home', viewModel);

    try {
      await controller.get(request, response);
      assert.calledOnce(getFiltersStub);
      assert.calledOnce(getHomePageViewModelStub);
      assert.calledWith(getHomePageViewModelStub, filters, false);
      responseMock.verify();
    } finally {
      getFiltersStub.restore();
      getHomePageViewModelStub.restore();
    }
  });
});
