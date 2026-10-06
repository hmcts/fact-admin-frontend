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
} from '../utils/constants/messageConstants';
import { SEARCH_REGEX } from '../utils/constants/regexConstants';
import {
  parseClampedNumber,
  validateIntegerQueryParameter,
  validateSortParameters,
} from '../utils/listFilterValidation';
import { parseOptionalString, parseString } from '../utils/valueParsers';

import { UsersPageFilters, UsersPageValidationError } from './types/UsersPage.types';

export class UsersPageFiltersService {
  public getFilters(query: Record<string, unknown>): UsersPageFilters {
    const rawSortBy = parseOptionalString(query.sortBy);
    const sortBy = rawSortBy === 'lastLogin' ? rawSortBy : '';
    const rawSortOrder = parseOptionalString(query.sortOrder);

    return {
      pageNumber: parseClampedNumber(query.pageNumber, DEFAULT_PAGE_NUMBER, MAX_PAGE_PARAM),
      pageSize: parseClampedNumber(query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_PARAM),
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

    const pageSizeError = validateIntegerQueryParameter(filters.rawPageSize, {
      href: '#main-content',
      maximum: MAX_PAGE_PARAM,
      maximumError: PAGE_SIZE_MAX_ERROR,
      minimum: 1,
      minimumError: PAGE_SIZE_MIN_ERROR,
    });
    if (pageSizeError) {
      errors.push(pageSizeError);
    }

    const pageNumberError = validateIntegerQueryParameter(filters.rawPageNumber, {
      href: '#main-content',
      maximum: MAX_PAGE_PARAM,
      maximumError: PAGE_NUMBER_MAX_ERROR,
      minimum: 0,
      minimumError: PAGE_NUMBER_MIN_ERROR,
    });
    if (pageNumberError) {
      errors.push(pageNumberError);
    }

    errors.push(
      ...validateSortParameters(
        filters.rawSortBy,
        filters.rawSortOrder,
        VALID_SORT_BY_LAST_LOGIN_VALUES,
        SORT_ORDER_WITHOUT_SORT_BY_ERROR
      )
    );

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
