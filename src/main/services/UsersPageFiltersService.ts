import { GetUsersParams } from '../requests/types/GetUsersParams';
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_ORDER,
  MAX_PAGE_PARAM,
  PAGE_NUMBER_MAX_ERROR,
  PAGE_NUMBER_MIN_ERROR,
  PAGE_SIZE_MAX_ERROR,
  PAGE_SIZE_MIN_ERROR,
  SEARCH_MAX_LENGTH,
  SORT_ORDER_WITHOUT_SORT_BY_ERROR,
  USERS_PAGE_SEARCH_VALIDATION_ERROR,
  VALID_SORT_BY_LAST_LOGIN_VALUES,
  VALID_SORT_ORDER_VALUES,
} from '../utils/constants/messageConstants';
import { SEARCH_REGEX } from '../utils/constants/regexConstants';
import { parseNumber, parseOptionalString, parseString } from '../utils/valueParsers';

import { UsersPageFilters, UsersPageValidationError } from './types/UsersPage.types';

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

    if (filters.search.length > SEARCH_MAX_LENGTH || !SEARCH_REGEX.test(filters.search)) {
      errors.push({
        href: '#search',
        text: USERS_PAGE_SEARCH_VALIDATION_ERROR,
      });
    }

    if (filters.rawPageSize !== undefined) {
      const pageSize = Number(filters.rawPageSize);
      if (!Number.isInteger(pageSize) || pageSize <= 0) {
        errors.push({ href: '#main-content', text: PAGE_SIZE_MIN_ERROR });
      } else if (pageSize > MAX_PAGE_PARAM) {
        errors.push({ href: '#main-content', text: PAGE_SIZE_MAX_ERROR });
      }
    }

    if (filters.rawPageNumber !== undefined) {
      const pageNumber = Number(filters.rawPageNumber);
      if (!Number.isInteger(pageNumber) || pageNumber < 0) {
        errors.push({ href: '#main-content', text: PAGE_NUMBER_MIN_ERROR });
      } else if (pageNumber > MAX_PAGE_PARAM) {
        errors.push({ href: '#main-content', text: PAGE_NUMBER_MAX_ERROR });
      }
    }

    if (filters.rawSortOrder !== undefined && filters.rawSortBy === undefined) {
      errors.push({ href: '#main-content', text: SORT_ORDER_WITHOUT_SORT_BY_ERROR });
    }

    if (filters.rawSortBy !== undefined && filters.rawSortBy !== 'lastLogin') {
      errors.push({
        href: '#main-content',
        text: `sortBy must be one of: ${VALID_SORT_BY_LAST_LOGIN_VALUES.join(', ')}`,
      });
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
