import { GetCourtsParams } from '../requests/types/GetCourtsParams';
import { Region } from '../schemas/regionSchema';
import { isUuid, parseNumber, parseOptionalString, parseString } from '../utils/valueParsers';
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_ORDER,
  HOME_PAGE_FAVOURITES_PAGE_NUMBER_MAX_ERROR,
  HOME_PAGE_FAVOURITES_PAGE_NUMBER_MIN_ERROR,
  HOME_PAGE_INCLUDE_CLOSED_BOOLEAN_ERROR,
  HOME_PAGE_ONLY_SERVICE_CENTRES_BOOLEAN_ERROR,
  HOME_PAGE_REGION_INVALID_ERROR,
  HOME_PAGE_REGION_UUID_ERROR,
  MAX_PAGE_PARAM,
  PAGE_NUMBER_MAX_ERROR,
  PAGE_NUMBER_MIN_ERROR,
  PAGE_SIZE_MAX_ERROR,
  PAGE_SIZE_MIN_ERROR,
  PARTIAL_COURT_NAME_ERROR,
  PARTIAL_COURT_NAME_REGEX,
  SORT_ORDER_WITHOUT_SORT_BY_ERROR,
  VALID_SORT_BY_VALUES,
  VALID_SORT_ORDER_VALUES,
} from '../utils/variablesConstants';

import { HomePageFilters, HomePageValidationError } from './types/HomePage.types';

/**
 * Parses, validates, and maps homepage query filters.
 */
export class HomePageFiltersService {
  /**
   * Parses homepage query parameters into the internal filter shape.
   */
  public getFilters(query: Record<string, unknown>): HomePageFilters {
    const rawSortBy = parseOptionalString(query.sortBy);
    const sortBy = this.isSortBy(rawSortBy) ? rawSortBy : '';
    const rawSortOrder = parseOptionalString(query.sortOrder);

    return {
      activeTab: query.tab === 'favourites' ? 'favourites' : 'courts',
      favouritesPageNumber: Math.min(parseNumber(query.favouritesPageNumber, DEFAULT_PAGE_NUMBER), MAX_PAGE_PARAM),
      includeClosed: query.includeClosed === 'true' || query.includeClosed === 'on',
      onlyServiceCentres: query.onlyServiceCentres === 'true' || query.onlyServiceCentres === 'on',
      pageNumber: Math.min(parseNumber(query.pageNumber, DEFAULT_PAGE_NUMBER), MAX_PAGE_PARAM),
      pageSize: Math.min(parseNumber(query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_PARAM),
      partialCourtName: parseString(query.partialCourtName),
      regionId: parseString(query.regionId),
      sortBy,
      sortOrder: rawSortOrder === 'desc' ? 'desc' : DEFAULT_SORT_ORDER,
      rawIncludeClosed: parseOptionalString(query.includeClosed),
      rawFavouritesPageNumber: parseOptionalString(query.favouritesPageNumber),
      rawOnlyServiceCentres: parseOptionalString(query.onlyServiceCentres),
      rawPageNumber: parseOptionalString(query.pageNumber),
      rawPageSize: parseOptionalString(query.pageSize),
      rawSortBy,
      rawSortOrder,
    };
  }

  /**
   * Validates homepage filters against the UI and API rules.
   */
  public validateFilters(filters: HomePageFilters, regions: Region[]): HomePageValidationError[] {
    const errors: HomePageValidationError[] = [];

    // Partial court name
    if (!PARTIAL_COURT_NAME_REGEX.test(filters.partialCourtName)) {
      errors.push({
        href: '#partialCourtName',
        text: PARTIAL_COURT_NAME_ERROR,
      });
    }

    // Pagination filters
    this.detectPaginationFilterErrors(filters, errors);

    // favourites pagination
    if (filters.rawFavouritesPageNumber !== undefined) {
      const favouritesPageNumber = Number(filters.rawFavouritesPageNumber);
      if (!Number.isInteger(favouritesPageNumber) || favouritesPageNumber < 0) {
        errors.push({
          href: '#favourites',
          text: HOME_PAGE_FAVOURITES_PAGE_NUMBER_MIN_ERROR,
        });
      } else if (favouritesPageNumber > MAX_PAGE_PARAM) {
        errors.push({
          href: '#favourites',
          text: HOME_PAGE_FAVOURITES_PAGE_NUMBER_MAX_ERROR,
        });
      }
    }

    // Region
    const regionError = this.validateRegion(filters.regionId, regions);
    if (regionError) {
      errors.push(regionError);
    }

    // Sorting
    this.detectSortingErrors(filters, errors);

    return errors;
  }

  private detectPaginationFilterErrors(filters: HomePageFilters, errors: HomePageValidationError[]): void {
    if (
      filters.rawIncludeClosed !== undefined &&
      filters.rawIncludeClosed !== 'true' &&
      filters.rawIncludeClosed !== 'false' &&
      filters.rawIncludeClosed !== 'on'
    ) {
      errors.push({
        href: '#main-content',
        text: HOME_PAGE_INCLUDE_CLOSED_BOOLEAN_ERROR,
      });
    }

    if (
      filters.rawOnlyServiceCentres !== undefined &&
      filters.rawOnlyServiceCentres !== 'true' &&
      filters.rawOnlyServiceCentres !== 'false' &&
      filters.rawOnlyServiceCentres !== 'on'
    ) {
      errors.push({
        href: '#main-content',
        text: HOME_PAGE_ONLY_SERVICE_CENTRES_BOOLEAN_ERROR,
      });
    }
    if (filters.rawPageSize !== undefined) {
      const pageSize = Number(filters.rawPageSize);
      if (!Number.isInteger(pageSize) || pageSize <= 0) {
        errors.push({
          href: '#main-content',
          text: PAGE_SIZE_MIN_ERROR,
        });
      } else if (pageSize > MAX_PAGE_PARAM) {
        errors.push({
          href: '#main-content',
          text: PAGE_SIZE_MAX_ERROR,
        });
      }
    }

    if (filters.rawPageNumber !== undefined) {
      const pageNumber = Number(filters.rawPageNumber);
      if (!Number.isInteger(pageNumber) || pageNumber < 0) {
        errors.push({
          href: '#main-content',
          text: PAGE_NUMBER_MIN_ERROR,
        });
      } else if (pageNumber > MAX_PAGE_PARAM) {
        errors.push({
          href: '#main-content',
          text: PAGE_NUMBER_MAX_ERROR,
        });
      }
    }
  }

  private detectSortingErrors(filters: HomePageFilters, errors: HomePageValidationError[]): void {
    if (filters.rawSortOrder !== undefined && filters.rawSortBy === undefined) {
      errors.push({
        href: '#main-content',
        text: SORT_ORDER_WITHOUT_SORT_BY_ERROR,
      });
    }

    if (filters.rawSortBy !== undefined && !this.isSortBy(filters.rawSortBy)) {
      errors.push({
        href: '#main-content',
        text: `sortBy must be one of: ${VALID_SORT_BY_VALUES.join(', ')}`,
      });
    }

    if (filters.rawSortOrder !== undefined && filters.rawSortOrder !== 'asc' && filters.rawSortOrder !== 'desc') {
      errors.push({
        href: '#main-content',
        text: `sortOrder must be one of: ${VALID_SORT_ORDER_VALUES.join(', ')}`,
      });
    }
  }

  /**
   * Maps validated homepage filters into the request params expected by the courts endpoint.
   */
  public toGetCourtsParams(filters: HomePageFilters): GetCourtsParams {
    const params: GetCourtsParams = {
      includeClosed: filters.includeClosed,
      onlyServiceCentres: filters.onlyServiceCentres,
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
    };

    if (filters.partialCourtName) {
      params.partialCourtName = filters.partialCourtName;
    }
    if (filters.regionId) {
      params.regionId = filters.regionId;
    }
    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
      params.sortOrder = filters.sortOrder;
    }

    return params;
  }

  /**
   * Validates the region filter against UUID format and the known region list when provided.
   */
  private validateRegion(regionId: string, regions: Region[]): HomePageValidationError | undefined {
    if (!regionId) {
      return undefined;
    }

    if (!isUuid(regionId)) {
      return {
        href: '#regionId',
        text: HOME_PAGE_REGION_UUID_ERROR,
      };
    }

    if (regions.length > 0 && !regions.some(region => region.id === regionId)) {
      return {
        href: '#regionId',
        text: HOME_PAGE_REGION_INVALID_ERROR,
      };
    }

    return undefined;
  }

  /**
   * Type guard for the allowed sortBy values supported by the homepage and API.
   */
  private isSortBy(value: string | undefined): value is 'lastUpdated' | 'name' {
    return value === 'lastUpdated' || value === 'name';
  }
}
