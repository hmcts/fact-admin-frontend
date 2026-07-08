import { GetUsersParams } from '../requests/types/GetUsersParams';
import { parseNumber, parseOptionalString, parseString } from '../utils/valueParsers';

import { UsersPageFilters, UsersPageValidationError } from './types/UsersPage.types';

const DEFAULT_PAGE_NUMBER = 0;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_PARAM = 1000;
const DEFAULT_SORT_ORDER = 'asc';
const SEARCH_PATTERN = /^[A-Za-z0-9._+\-@]*$/;
const VALID_SORT_BY_VALUES = ['lastLogin'] as const;
const VALID_SORT_ORDER_VALUES = ['asc', 'desc'] as const;

export class UsersPageFiltersService {
  public getFilters(query: Record<string, unknown>): UsersPageFilters {
    const rawSortBy = parseOptionalString(query.sortBy);
    const sortBy = rawSortBy === 'lastLogin' ? rawSortBy : '';
    const rawSortOrder = parseOptionalString(query.sortOrder);

    return {
      pageNumber: Math.min(parseNumber(query.pageNumber, DEFAULT_PAGE_NUMBER), MAX_PAGE_PARAM),
      pageSize: Math.min(parseNumber(query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_PARAM),
      rawPageNumber: parseOptionalString(query.pageNumber),
      rawPageSize: parseOptionalString(query.pageSize),
      rawSearch: parseOptionalString(query.search),
      rawSortBy,
      rawSortOrder,
      search: parseString(query.search).trim(),
      sortBy,
      sortOrder: rawSortOrder === 'desc' ? 'desc' : DEFAULT_SORT_ORDER,
    };
  }

  public validateFilters(filters: UsersPageFilters): UsersPageValidationError[] {
    const errors: UsersPageValidationError[] = [];

    if (filters.search.length > 254 || !SEARCH_PATTERN.test(filters.search)) {
      errors.push({
        href: '#search',
        text: 'Search must only include letters, numbers, @ symbols, dots, underscores, plus signs and hyphens.',
      });
    }

    if (filters.rawPageSize !== undefined) {
      const pageSize = Number(filters.rawPageSize);
      if (!Number.isInteger(pageSize) || pageSize <= 0) {
        errors.push({ href: '#main-content', text: 'pageSize must be greater than 0' });
      } else if (pageSize > MAX_PAGE_PARAM) {
        errors.push({ href: '#main-content', text: `pageSize must be less than or equal to ${MAX_PAGE_PARAM}` });
      }
    }

    if (filters.rawPageNumber !== undefined) {
      const pageNumber = Number(filters.rawPageNumber);
      if (!Number.isInteger(pageNumber) || pageNumber < 0) {
        errors.push({ href: '#main-content', text: 'pageNumber must be greater than or equal to 0' });
      } else if (pageNumber > MAX_PAGE_PARAM) {
        errors.push({ href: '#main-content', text: `pageNumber must be less than or equal to ${MAX_PAGE_PARAM}` });
      }
    }

    if (filters.rawSortOrder !== undefined && filters.rawSortBy === undefined) {
      errors.push({ href: '#main-content', text: 'sortOrder cannot be provided without sortBy' });
    }

    if (filters.rawSortBy !== undefined && filters.rawSortBy !== 'lastLogin') {
      errors.push({ href: '#main-content', text: `sortBy must be one of: ${VALID_SORT_BY_VALUES.join(', ')}` });
    }

    if (filters.rawSortOrder !== undefined && !VALID_SORT_ORDER_VALUES.includes(filters.rawSortOrder as never)) {
      errors.push({ href: '#main-content', text: `sortOrder must be one of: ${VALID_SORT_ORDER_VALUES.join(', ')}` });
    }

    return errors;
  }

  public toGetUsersParams(filters: UsersPageFilters): GetUsersParams {
    const params: GetUsersParams = {
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
    };

    if (filters.search) {
      params.search = filters.search;
    }
    if (filters.sortBy) {
      params.sortBy = filters.sortBy;
      params.sortOrder = filters.sortOrder;
    }

    return params;
  }
}
