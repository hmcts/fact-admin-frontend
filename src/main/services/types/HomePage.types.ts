export type HomePageTableHeadCell = {
  attributes?: Record<string, string>;
  classes?: string;
  html?: string;
  text?: string;
};

export type HomePageTableCell = {
  classes?: string;
  html?: string;
  text?: string;
};

export type HomePageFilters = {
  activeTab?: 'courts' | 'favourites';
  favouritesPageNumber?: number;
  includeClosed: boolean;
  onlyServiceCentres: boolean;
  pageNumber: number;
  pageSize: number;
  partialCourtName: string;
  regionId: string;
  sortBy: '' | 'lastUpdated' | 'name';
  sortOrder: 'asc' | 'desc';
  rawIncludeClosed?: string;
  rawFavouritesPageNumber?: string;
  rawOnlyServiceCentres?: string;
  rawPageNumber?: string;
  rawPageSize?: string;
  rawSortBy?: string;
  rawSortOrder?: string;
};

export type HomePagePaginationLink = {
  current?: boolean;
  ellipsis?: boolean;
  href: string;
  number: number;
};

export type HomePageValidationError = {
  href: string;
  text: string;
};

export type HomePagePagination = {
  currentPage: number;
  items: HomePagePaginationLink[];
  next?: { href: string };
  previous?: { href: string };
  totalPages: number;
};

export type HomePageRegionOption = {
  selected?: boolean;
  text: string;
  value: string;
};

export type HomePageHrefOverrides = Partial<Pick<HomePageFilters, 'pageNumber' | 'sortBy' | 'sortOrder'>>;

export type HomePageViewModel = {
  courtTableHead: HomePageTableHeadCell[];
  courtTableRows: HomePageTableCell[][];
  courtFavouriteStatusErrorMessage?: string;
  errorMessage?: string;
  errorSummary: HomePageValidationError[];
  filters: HomePageFilters;
  includeStatusColumn: boolean;
  favouriteTableHead: HomePageTableHeadCell[];
  favouriteTableRows: HomePageTableCell[][];
  favouritesErrorMessage?: string;
  favouritesPagination: HomePagePagination;
  favouritesResultsMessage: string;
  pageTitle: string;
  partialCourtNameError?: string;
  pagination: HomePagePagination;
  regionOptions: HomePageRegionOption[];
  resultsMessage: string;
};
