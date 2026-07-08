import type { User } from '../../schemas/userSchema';

export type UsersPageFilters = {
  pageNumber: number;
  pageSize: number;
  rawPageNumber?: string;
  rawPageSize?: string;
  rawSearch?: string;
  rawSortBy?: string;
  rawSortOrder?: string;
  search: string;
  sortBy: '' | 'lastLogin';
  sortOrder: 'asc' | 'desc';
};

export type UsersPageTableHeadCell = {
  attributes?: Record<string, string>;
  html?: string;
  text?: string;
};

export type UsersPageTableCell = {
  html?: string;
  text?: string;
};

export type UsersPagePaginationLink = {
  current?: boolean;
  ellipsis?: boolean;
  href: string;
  number: number;
};

export type UsersPagePagination = {
  items: UsersPagePaginationLink[];
  next?: { href: string };
  previous?: { href: string };
  totalPages: number;
};

export type UsersPageValidationError = {
  href: string;
  text: string;
};

export type UsersPageViewModel = {
  errorMessage?: string;
  errorSummary: UsersPageValidationError[];
  filters: UsersPageFilters;
  pageTitle: string;
  pagination: UsersPagePagination;
  resultsMessage: string;
  searchError?: string;
  users: User[];
  userTableHead: UsersPageTableHeadCell[];
  userTableRows: UsersPageTableCell[][];
};

export type UsersPageHrefOverrides = Partial<Pick<UsersPageFilters, 'pageNumber' | 'sortBy' | 'sortOrder'>>;
