import { PagedUsers } from '../schemas/userListSchema';
import type { User } from '../schemas/userSchema';

import {
  UsersPageFilters,
  UsersPageHrefOverrides,
  UsersPagePagination,
  UsersPagePaginationLink,
  UsersPageTableCell,
  UsersPageTableHeadCell,
} from './types/UsersPage.types';

const DEFAULT_PAGE_NUMBER = 0;
const DEFAULT_PAGE_SIZE = 25;
const UK_TIME_ZONE = 'Europe/London';
const SORT_ICON_PATHS = {
  ascending: '<path d="M6.5625 15.5L11 6.63125L15.4375 15.5H6.5625Z" fill="currentColor"/>',
  descending: '<path d="M15.4375 7L11 15.8687L6.5625 7L15.4375 7Z" fill="currentColor"/>',
  none: '<path d="M8.1875 9.5L10.9609 3.95703L13.7344 9.5H8.1875Z" fill="currentColor"/><path d="M13.7344 12.0781L10.9609 17.6211L8.1875 12.0781H13.7344Z" fill="currentColor"/>',
} as const;

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
      items: this.buildPaginationItems(totalPages, currentPage, filters),
      next:
        currentPage < totalPages - 1 ? { href: this.buildHref(filters, { pageNumber: currentPage + 1 }) } : undefined,
      previous: currentPage > 0 ? { href: this.buildHref(filters, { pageNumber: currentPage - 1 }) } : undefined,
      totalPages,
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

  private buildPaginationItems(
    totalPages: number,
    currentPage: number,
    filters: UsersPageFilters
  ): UsersPagePaginationLink[] {
    if (totalPages <= 1) {
      return [];
    }

    return this.buildPaginationItemsFromIndexes(
      this.getVisiblePageIndexes(totalPages, currentPage),
      currentPage,
      filters
    );
  }

  private getVisiblePageIndexes(totalPages: number, currentPage: number): number[] {
    const pageIndexes = new Set<number>([0, totalPages - 1, currentPage]);

    if (currentPage > 0) {
      pageIndexes.add(currentPage - 1);
    }
    if (currentPage < totalPages - 1) {
      pageIndexes.add(currentPage + 1);
    }

    return Array.from(pageIndexes)
      .filter(index => index >= 0 && index < totalPages)
      .sort((left, right) => left - right);
  }

  private buildPaginationItemsFromIndexes(
    pageIndexes: number[],
    currentPage: number,
    filters: UsersPageFilters
  ): UsersPagePaginationLink[] {
    const items: UsersPagePaginationLink[] = [];

    pageIndexes.forEach((pageIndex, index) => {
      if (index > 0 && pageIndex - pageIndexes[index - 1] > 1) {
        items.push({
          ellipsis: true,
          href: '',
          number: -1,
        });
      }

      items.push({
        current: pageIndex === currentPage,
        href: this.buildHref(filters, { pageNumber: pageIndex }),
        number: pageIndex + 1,
      });
    });

    return items;
  }

  private buildSortableHeadItem(label: string, filters: UsersPageFilters): UsersPageTableHeadCell {
    const isCurrentSort = filters.sortBy === 'lastLogin';
    const ariaSort = isCurrentSort ? (filters.sortOrder === 'desc' ? 'descending' : 'ascending') : 'none';
    const nextSortOrder = isCurrentSort && filters.sortOrder === 'asc' ? 'descending' : 'ascending';

    return {
      attributes: {
        'aria-sort': ariaSort,
      },
      html: `<a class="homepage-sort-link govuk-link govuk-link--no-visited-state" href="${this.buildHref(filters, {
        pageNumber: DEFAULT_PAGE_NUMBER,
        sortBy: 'lastLogin',
        sortOrder: isCurrentSort && filters.sortOrder === 'asc' ? 'desc' : 'asc',
      })}">${label}${this.getSortIconSvg(ariaSort)}<span class="govuk-visually-hidden">, sort ${nextSortOrder}</span></a>`,
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

  private getSortIconSvg(ariaSort: 'ascending' | 'descending' | 'none'): string {
    return [
      '<svg class="homepage-sort-icon" width="22" height="22" focusable="false" aria-hidden="true" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">',
      SORT_ICON_PATHS[ariaSort],
      '</svg>',
    ].join('');
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
