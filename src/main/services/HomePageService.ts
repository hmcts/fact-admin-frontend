import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { PagedCourts } from '../schemas/courtListSchema';
import { FavouriteStatus, PagedFavourites } from '../schemas/favouriteSchema';
import { Region } from '../schemas/regionSchema';

import { HomePageFiltersService } from './HomePageFiltersService';
import { HomePageViewService, buildFavouriteKey } from './HomePageViewService';
import { HomePageFilters, HomePageViewModel } from './types/HomePage.types';

/**
 * Coordinates homepage data loading and delegates filter and view-model concerns
 * to smaller focused services.
 */
export class HomePageService {
  public constructor(
    private readonly dataApiRequests = new DataApiRequests(),
    private readonly homePageFiltersService = new HomePageFiltersService(),
    private readonly homePageViewService = new HomePageViewService()
  ) {}

  /**
   * Builds the full homepage view model from parsed filters and upstream API data.
   */
  public async getHomePageViewModel(filters: HomePageFilters, isReviewMode = false): Promise<HomePageViewModel> {
    const requestedFavouritesPage = filters.favouritesPageNumber ?? 0;
    const [regionsResponse, initialFavouritesResponse] = await Promise.all([
      this.dataApiRequests.getRegions(),
      this.dataApiRequests.getFavourites({ pageNumber: requestedFavouritesPage, pageSize: 25 }),
    ]);
    const regions = Array.isArray(regionsResponse) ? regionsResponse : [];
    const validationErrors = this.homePageFiltersService.validateFilters(filters, regions);
    const courtsResponse =
      validationErrors.length === 0
        ? await this.dataApiRequests.getCourts(this.homePageFiltersService.toGetCourtsParams(filters))
        : HttpStatusCode.BadRequest;

    const courtsPage = this.isPagedCourts(courtsResponse) ? courtsResponse : this.emptyCourtsPage(filters);
    const favouriteStatusesResponse =
      this.isPagedCourts(courtsResponse) && courtsPage.content.length > 0
        ? await this.dataApiRequests.getFavouriteStatuses(
            courtsPage.content.map(location => ({
              subjectId: location.id,
              subjectType: location.locationType,
            }))
          )
        : [];
    const favouriteStatuses = Array.isArray(favouriteStatusesResponse)
      ? this.toFavouriteStatusMap(favouriteStatusesResponse)
      : undefined;

    const resolvedFavourites = await this.resolveFavouritesPage(initialFavouritesResponse, filters);
    const effectiveFilters = {
      ...filters,
      favouritesPageNumber: resolvedFavourites.page.page.number,
    };
    const partialCourtNameError = validationErrors.find(error => error.href === '#partialCourtName')?.text;

    return {
      courtFavouriteStatusErrorMessage: Array.isArray(favouriteStatusesResponse)
        ? undefined
        : 'There was a problem loading favourite status.',
      courtTableHead: this.homePageViewService.buildCourtTableHead(effectiveFilters),
      courtTableRows: this.homePageViewService.buildCourtTableRows(
        effectiveFilters,
        courtsPage,
        isReviewMode,
        favouriteStatuses
      ),
      errorMessage: validationErrors.length === 0 ? this.buildErrorMessage(regionsResponse, courtsResponse) : undefined,
      errorSummary: validationErrors,
      favouriteTableHead: this.homePageViewService.buildFavouriteTableHead(),
      favouriteTableRows: this.homePageViewService.buildFavouriteTableRows(
        effectiveFilters,
        resolvedFavourites.page,
        isReviewMode
      ),
      favouritesErrorMessage: resolvedFavourites.error ? 'There was a problem loading favourites.' : undefined,
      favouritesPagination: this.homePageViewService.buildFavouritesPagination(
        resolvedFavourites.page,
        effectiveFilters
      ),
      favouritesResultsMessage: this.homePageViewService.buildFavouritesResultsMessage(resolvedFavourites.page),
      filters: effectiveFilters,
      includeStatusColumn: filters.includeClosed,
      pageTitle:
        effectiveFilters.activeTab === 'favourites'
          ? this.homePageViewService.buildFavouritesPageTitle(resolvedFavourites.page)
          : this.homePageViewService.buildPageTitle(courtsPage, validationErrors.length > 0),
      pagination: this.homePageViewService.buildPagination(courtsPage, filters),
      partialCourtNameError,
      regionOptions: this.homePageViewService.buildRegionOptions(regions, filters.regionId),
      resultsMessage: this.homePageViewService.buildResultsMessage(courtsPage),
    };
  }

  /**
   * Normalises raw query parameters into the filter shape used by the homepage.
   */
  public getFilters(query: Record<string, unknown>): HomePageFilters {
    return this.homePageFiltersService.getFilters(query);
  }

  /**
   * Builds a high-level page error message when one or both upstream API calls fail.
   */
  private buildErrorMessage(
    regionsResponse: Region[] | HttpStatusCode,
    courtsResponse: PagedCourts | HttpStatusCode
  ): string | undefined {
    const hasRegionError = !Array.isArray(regionsResponse);
    const hasCourtsError = !this.isPagedCourts(courtsResponse);

    return hasRegionError && hasCourtsError
      ? 'There was a problem loading regions and courts, tribunals and service centres.'
      : hasRegionError
        ? 'There was a problem loading regions.'
        : hasCourtsError
          ? 'There was a problem loading courts, tribunals and service centres.'
          : undefined;
  }

  /**
   * Returns an empty paged response shape for validation or upstream failure cases.
   */
  private emptyCourtsPage(filters: HomePageFilters): PagedCourts {
    return {
      content: [],
      page: {
        number: filters.pageNumber,
        size: filters.pageSize,
        totalElements: 0,
        totalPages: 0,
      },
    };
  }

  private emptyFavouritesPage(pageNumber: number): PagedFavourites {
    return {
      content: [],
      page: {
        number: pageNumber,
        size: 25,
        totalElements: 0,
        totalPages: 0,
      },
    };
  }

  private async resolveFavouritesPage(
    response: PagedFavourites | HttpStatusCode,
    filters: HomePageFilters
  ): Promise<{ error: boolean; page: PagedFavourites }> {
    if (!this.isPagedCourts(response)) {
      return { error: true, page: this.emptyFavouritesPage(filters.favouritesPageNumber ?? 0) };
    }

    if (
      (filters.favouritesPageNumber ?? 0) > 0 &&
      response.content.length === 0 &&
      response.page.totalPages > 0 &&
      (filters.favouritesPageNumber ?? 0) >= response.page.totalPages
    ) {
      const lastPageNumber = response.page.totalPages - 1;
      const lastPage = await this.dataApiRequests.getFavourites({ pageNumber: lastPageNumber, pageSize: 25 });
      return this.isPagedCourts(lastPage)
        ? { error: false, page: lastPage }
        : { error: true, page: this.emptyFavouritesPage(lastPageNumber) };
    }

    return { error: false, page: response };
  }

  private toFavouriteStatusMap(statuses: FavouriteStatus[]): Map<string, boolean> {
    return new Map(statuses.map(status => [buildFavouriteKey(status.subjectType, status.subjectId), status.favourite]));
  }

  /**
   * Type guard for distinguishing a successful paged courts response from an HTTP status code.
   */
  private isPagedCourts(response: PagedCourts | HttpStatusCode): response is PagedCourts {
    return typeof response === 'object' && response !== null && 'content' in response && 'page' in response;
  }
}
