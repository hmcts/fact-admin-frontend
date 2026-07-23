import { GetCourtsParams } from '../requests/types/GetCourtsParams';
import { Region } from '../schemas/regionSchema';
import { isUuid, parseNumber, parseOptionalString, parseString } from '../utils/valueParsers';

import { HomePageFilters, HomePageValidationError } from './types/HomePage.types';

const DEFAULT_PAGE_NUMBER = 0;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_PARAM = 1000;
const DEFAULT_SORT_ORDER = 'asc';
const PARTIAL_COURT_NAME_PATTERN = /^[A-Za-z&'()\- ]*$/;
const PARTIAL_COURT_NAME_ERROR =
  'Court or tribunal name must only include letters, spaces, brackets, apostrophes, hyphens and ampersands.';
const VALID_SORT_BY_VALUES = ['lastUpdated', 'name'] as const;
const VALID_SORT_ORDER_VALUES = ['asc', 'desc'] as const;

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
    if (!PARTIAL_COURT_NAME_PATTERN.test(filters.partialCourtName)) {
      errors.push({
        href: '#partialCourtName',
        text: PARTIAL_COURT_NAME_ERROR,
      });
    }

    // Pagination and boolean filters
    if (
      filters.rawIncludeClosed !== undefined &&
      filters.rawIncludeClosed !== 'true' &&
      filters.rawIncludeClosed !== 'false' &&
      filters.rawIncludeClosed !== 'on'
    ) {
      errors.push({
        href: '#main-content',
        text: 'includeClosed must be true or false',
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
        text: 'onlyServiceCentres must be true or false',
      });
    }

    if (filters.rawPageSize !== undefined) {
      const pageSize = Number(filters.rawPageSize);
      if (!Number.isInteger(pageSize) || pageSize <= 0) {
        errors.push({
          href: '#main-content',
          text: 'pageSize must be greater than 0',
        });
      } else if (pageSize > MAX_PAGE_PARAM) {
        errors.push({
          href: '#main-content',
          text: `pageSize must be less than or equal to ${MAX_PAGE_PARAM}`,
        });
      }
    }

    if (filters.rawPageNumber !== undefined) {
      const pageNumber = Number(filters.rawPageNumber);
      if (!Number.isInteger(pageNumber) || pageNumber < 0) {
        errors.push({
          href: '#main-content',
          text: 'pageNumber must be greater than or equal to 0',
        });
      } else if (pageNumber > MAX_PAGE_PARAM) {
        errors.push({
          href: '#main-content',
          text: `pageNumber must be less than or equal to ${MAX_PAGE_PARAM}`,
        });
      }
    }

    if (filters.rawFavouritesPageNumber !== undefined) {
      const favouritesPageNumber = Number(filters.rawFavouritesPageNumber);
      if (!Number.isInteger(favouritesPageNumber) || favouritesPageNumber < 0) {
        errors.push({
          href: '#favourites',
          text: 'favouritesPageNumber must be greater than or equal to 0',
        });
      } else if (favouritesPageNumber > MAX_PAGE_PARAM) {
        errors.push({
          href: '#favourites',
          text: `favouritesPageNumber must be less than or equal to ${MAX_PAGE_PARAM}`,
        });
      }
    }

    // Region
    const regionError = this.validateRegion(filters.regionId, regions);
    if (regionError) {
      errors.push(regionError);
    }

    // Sorting
    if (filters.rawSortOrder !== undefined && filters.rawSortBy === undefined) {
      errors.push({
        href: '#main-content',
        text: 'sortOrder cannot be provided without sortBy',
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

    return errors;
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
        text: 'Region must be a valid UUID',
      };
    }

    if (regions.length > 0 && !regions.some(region => region.id === regionId)) {
      return {
        href: '#regionId',
        text: 'Region must be a valid region',
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
