import { HttpStatusCode } from 'axios';

import { HomePageService } from '../../../main/services/HomePageService';

describe('HomePageService favourites', () => {
  const court = location('11111111-1111-4111-8111-111111111111', 'COURT', 'Alpha Court');
  const serviceCentre = location('22222222-2222-4222-8222-222222222222', 'SERVICE_CENTRE', 'Beta Service Centre');

  test('merges batched status into Courts and builds the independent Favourites list', async () => {
    const requests = {
      getCourts: jest.fn().mockResolvedValue(page([court], 0, 1, 1)),
      getFavouriteStatuses: jest
        .fn()
        .mockResolvedValue([{ subjectId: court.id, subjectType: 'COURT', favourite: true }]),
      getFavourites: jest.fn().mockResolvedValue(page([serviceCentre], 0, 1, 1)),
      getRegions: jest.fn().mockResolvedValue([]),
    };
    const service = new HomePageService(requests as never);

    const viewModel = await service.getHomePageViewModel(service.getFilters({}));

    expect(requests.getFavouriteStatuses).toHaveBeenCalledWith([{ subjectId: court.id, subjectType: 'COURT' }]);
    expect(viewModel.courtTableRows[0][0].html).toContain('aria-pressed="true"');
    expect(viewModel.favouriteTableRows[0][1]).toEqual({ text: serviceCentre.name });
    expect(viewModel.favouritesResultsMessage).toContain('1 favourite');
    expect(viewModel.filters.activeTab).toBe('courts');
  });

  test('keeps Courts usable when the favourites list fails', async () => {
    const requests = {
      getCourts: jest.fn().mockResolvedValue(page([court], 0, 1, 1)),
      getFavouriteStatuses: jest
        .fn()
        .mockResolvedValue([{ subjectId: court.id, subjectType: 'COURT', favourite: false }]),
      getFavourites: jest.fn().mockResolvedValue(HttpStatusCode.ServiceUnavailable),
      getRegions: jest.fn().mockResolvedValue([]),
    };
    const service = new HomePageService(requests as never);

    const viewModel = await service.getHomePageViewModel(service.getFilters({}));

    expect(viewModel.courtTableRows).toHaveLength(1);
    expect(viewModel.favouritesErrorMessage).toBe('There was a problem loading favourites.');
    expect(viewModel.errorMessage).toBeUndefined();
  });

  test('suppresses Courts stars when status loading fails', async () => {
    const requests = {
      getCourts: jest.fn().mockResolvedValue(page([court], 0, 1, 1)),
      getFavouriteStatuses: jest.fn().mockResolvedValue(HttpStatusCode.BadGateway),
      getFavourites: jest.fn().mockResolvedValue(page([], 0, 0, 0)),
      getRegions: jest.fn().mockResolvedValue([]),
    };
    const service = new HomePageService(requests as never);

    const viewModel = await service.getHomePageViewModel(service.getFilters({}));

    expect(viewModel.courtTableRows[0][0]).toEqual({ classes: 'homepage-courts-table__favourite', html: '' });
    expect(viewModel.courtTableRows[0][1]).toEqual({ text: court.name });
    expect(viewModel.courtFavouriteStatusErrorMessage).toBe('There was a problem loading favourite status.');
  });

  test('clamps an empty out-of-range Favourites page to the last valid page', async () => {
    const requests = {
      getCourts: jest.fn().mockResolvedValue(page([], 0, 0, 0)),
      getFavouriteStatuses: jest.fn(),
      getFavourites: jest
        .fn()
        .mockResolvedValueOnce(page([], 2, 26, 2))
        .mockResolvedValueOnce(page([serviceCentre], 1, 26, 2)),
      getRegions: jest.fn().mockResolvedValue([]),
    };
    const service = new HomePageService(requests as never);

    const viewModel = await service.getHomePageViewModel(
      service.getFilters({ favouritesPageNumber: '2', tab: 'favourites' })
    );

    expect(requests.getFavourites).toHaveBeenNthCalledWith(2, { pageNumber: 1, pageSize: 25 });
    expect(viewModel.filters.favouritesPageNumber).toBe(1);
    expect(viewModel.filters.activeTab).toBe('favourites');
    expect(viewModel.favouriteTableRows).toHaveLength(1);
    expect(viewModel.pageTitle).toBe('Favourites (page 2 of 2)');
  });

  function page(content: ReturnType<typeof location>[], number: number, totalElements: number, totalPages: number) {
    return {
      content,
      page: { number, size: 25, totalElements, totalPages },
    };
  }

  function location(id: string, locationType: 'COURT' | 'SERVICE_CENTRE', name: string) {
    const isServiceCentre = locationType === 'SERVICE_CENTRE';
    return {
      createdAt: '2026-07-14T09:00:00Z',
      id,
      lastUpdatedAt: '2026-07-14T10:00:00Z',
      locationType,
      mrdId: isServiceCentre ? null : 'MRD-1',
      name,
      open: true,
      openOnCath: isServiceCentre ? null : true,
      regionId: null,
      serviceCentre: isServiceCentre,
      slug: name.toLowerCase().replaceAll(' ', '-'),
      warningNotice: null,
    };
  }
});
