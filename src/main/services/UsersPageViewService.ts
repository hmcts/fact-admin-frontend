import { PagedUsers } from '../schemas/userListSchema';
import type { User } from '../schemas/userSchema';
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE, UK_TIME_ZONE } from '../utils/constants/messageConstants';
import { buildPagination as buildSharedPagination } from '../utils/pagination';
import { buildSortIconSvg } from '../utils/viewHelpers';

import {
  UsersPageFilters,
  UsersPageHrefOverrides,
  UsersPagePagination,
  UsersPageTableCell,
  UsersPageTableHeadCell,
} from './types/UsersPage.types';

export class UsersPageViewService {
  public buildUserTableHead(filters: UsersPageFilters): UsersPageTableHeadCell[] {
    return [{ text: 'Email' }, { text: 'SSO ID' }, this.buildSortableHeadItem('Last login', filters), { text: 'Role' }];
  }

  public buildUserTableRows(usersPage: PagedUsers): UsersPageTableCell[][] {
    return usersPage.content.map(user => [
      { text: user.email },
      { text: user.ssoId },
      { text: this.formatDateTime(user.lastLogin) },
      { text: this.formatRole(user.role) },
    ]);
  }

  public buildPagination(usersPage: PagedUsers, filters: UsersPageFilters): UsersPagePagination {
    const totalPages = usersPage.page.totalPages ?? 0;
    const currentPage = usersPage.page.number ?? filters.pageNumber;

    return {
      ...buildSharedPagination(totalPages, currentPage, pageNumber => this.buildHref(filters, { pageNumber })),
    };
  }

  public buildPageTitle(usersPage: PagedUsers, hasValidationErrors: boolean): string {
    const titlePrefix = hasValidationErrors ? 'Error: ' : '';

    if ((usersPage.page.totalPages ?? 0) > 1) {
      return `${titlePrefix}Users (page ${(usersPage.page.number ?? DEFAULT_PAGE_NUMBER) + 1} of ${usersPage.page.totalPages})`;
    }

    return `${titlePrefix}Users`;
  }

  public buildResultsMessage(usersPage: PagedUsers): string {
    const totalElements = usersPage.page.totalElements ?? 0;

    if (totalElements === 0 || usersPage.content.length === 0) {
      return 'No users found.';
    }

    return `Showing ${(usersPage.page.number ?? DEFAULT_PAGE_NUMBER) * (usersPage.page.size ?? DEFAULT_PAGE_SIZE) + 1} to ${(usersPage.page.number ?? DEFAULT_PAGE_NUMBER) * (usersPage.page.size ?? DEFAULT_PAGE_SIZE) + usersPage.content.length} of ${totalElements} users`;
  }

  private buildSortableHeadItem(label: string, filters: UsersPageFilters): UsersPageTableHeadCell {
    const isCurrentSort = filters.sortBy === 'lastLogin';
    const sortOrder = filters.sortOrder === 'desc' ? 'descending' : 'ascending';
    const ariaSort = isCurrentSort ? sortOrder : 'none';
    const nextSortOrder = isCurrentSort && filters.sortOrder === 'asc' ? 'descending' : 'ascending';

    return {
      attributes: {
        'aria-sort': ariaSort,
      },
      html: `<a class="homepage-sort-link govuk-link govuk-link--no-visited-state" href="${this.buildHref(filters, {
        pageNumber: DEFAULT_PAGE_NUMBER,
        sortBy: 'lastLogin',
        sortOrder: isCurrentSort && filters.sortOrder === 'asc' ? 'desc' : 'asc',
      })}">${label}${buildSortIconSvg(ariaSort)}<span class="govuk-visually-hidden">, sort ${nextSortOrder}</span></a>`,
    };
  }

  private buildHref(filters: UsersPageFilters, overrides: UsersPageHrefOverrides): string {
    const query = new URLSearchParams();
    const pageNumber = overrides.pageNumber ?? filters.pageNumber;
    const sortBy = overrides.sortBy ?? filters.sortBy;
    const sortOrder = overrides.sortOrder ?? filters.sortOrder;

    if (filters.search) {
      query.set('search', filters.search);
    }
    if (filters.pageSize !== DEFAULT_PAGE_SIZE) {
      query.set('pageSize', filters.pageSize.toString());
    }
    if (sortBy) {
      query.set('sortBy', sortBy);
      query.set('sortOrder', sortOrder);
    }

    query.set('pageNumber', pageNumber.toString());

    return `/users?${query.toString()}`;
  }

  private formatDateTime(date: string): string {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      timeZone: UK_TIME_ZONE,
      year: 'numeric',
    }).format(parsedDate);
  }

  private formatRole(role: User['role']): string {
    if (role === 'Admin' || role === 'ADMIN') {
      return 'Admin';
    }

    if (role === 'SuperAdmin' || role === 'SUPER_ADMIN') {
      return 'Super admin';
    }

    return role;
  }
}
