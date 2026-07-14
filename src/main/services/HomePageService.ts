import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { PagedCourts } from '../schemas/courtListSchema';
import { Region } from '../schemas/regionSchema';

import { HomePageFiltersService } from './HomePageFiltersService';
import { HomePageViewService } from './HomePageViewService';
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
    const regionsResponse = await this.dataApiRequests.getRegions();
    const regions = Array.isArray(regionsResponse) ? regionsResponse : [];
    const validationErrors = this.homePageFiltersService.validateFilters(filters, regions);
    const courtsResponse =
      validationErrors.length === 0
        ? await this.dataApiRequests.getCourts(this.homePageFiltersService.toGetCourtsParams(filters))
        : HttpStatusCode.BadRequest;

    const courtsPage = this.isPagedCourts(courtsResponse) ? courtsResponse : this.emptyCourtsPage(filters);
    const partialCourtNameError = validationErrors.find(error => error.href === '#partialCourtName')?.text;

    return {
      courtTableHead: this.homePageViewService.buildCourtTableHead(filters),
      courtTableRows: this.homePageViewService.buildCourtTableRows(filters, courtsPage, isReviewMode),
      errorMessage: validationErrors.length === 0 ? this.buildErrorMessage(regionsResponse, courtsResponse) : undefined,
      errorSummary: validationErrors,
      filters,
      includeStatusColumn: filters.includeClosed,
      pageTitle: this.homePageViewService.buildPageTitle(courtsPage, validationErrors.length > 0),
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

  /**
   * Type guard for distinguishing a successful paged courts response from an HTTP status code.
   */
  private isPagedCourts(response: PagedCourts | HttpStatusCode): response is PagedCourts {
    return typeof response === 'object' && response !== null && 'content' in response && 'page' in response;
  }
}
