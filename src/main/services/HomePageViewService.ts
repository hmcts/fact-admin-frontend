import { LocationListItem, PagedCourts } from '../schemas/courtListSchema';
import { Region } from '../schemas/regionSchema';

import {
  HomePageFilters,
  HomePageHrefOverrides,
  HomePagePagination,
  HomePagePaginationLink,
  HomePageRegionOption,
  HomePageTableCell,
  HomePageTableHeadCell,
} from './types/HomePage.types';

const DEFAULT_PAGE_NUMBER = 0;
const DEFAULT_PAGE_SIZE = 25;
const HOME_PAGE_TITLE = 'Courts, tribunals and service centres';
const DEFAULT_RESULTS_MESSAGE = 'No courts, tribunals or service centres found.';
const PUBLIC_FRONTEND_URL = process.env.PUBLIC_FRONTEND_URL || 'https://localhost:3344';
const SORT_ICON_PATHS = {
  ascending: '<path d="M6.5625 15.5L11 6.63125L15.4375 15.5H6.5625Z" fill="currentColor"/>',
  descending: '<path d="M15.4375 7L11 15.8687L6.5625 7L15.4375 7Z" fill="currentColor"/>',
  none: '<path d="M8.1875 9.5L10.9609 3.95703L13.7344 9.5H8.1875Z" fill="currentColor"/><path d="M13.7344 12.0781L10.9609 17.6211L8.1875 12.0781H13.7344Z" fill="currentColor"/>',
} as const;

/**
 * Builds homepage-specific presentation structures such as table rows, links, and pagination.
 */
export class HomePageViewService {
  /**
   * Builds the table header configuration, including sortable columns and the optional status column.
   */
  public buildCourtTableHead(filters: HomePageFilters): HomePageTableHeadCell[] {
    return [
      this.buildSortableHeadItem('Name', 'name', filters),
      this.buildSortableHeadItem('Last updated', 'lastUpdated', filters),
      ...(filters.includeClosed ? [{ text: 'Status' }] : []),
      { classes: 'homepage-courts-table__actions', text: 'Actions' },
    ];
  }

  /**
   * Builds the homepage results table rows and action links.
   */
  public buildCourtTableRows(
    filters: HomePageFilters,
    courtsPage: PagedCourts,
    isReviewMode = false,
    favouriteStatuses?: Map<string, boolean>
  ): HomePageTableCell[][] {
    return courtsPage.content.map(court => [
      favouriteStatuses
        ? this.buildNameCell(
            court,
            favouriteStatuses.get(buildFavouriteKey(court.locationType, court.id)) ?? false,
            `${this.buildHref(filters, {})}#courts`,
            'courts'
          )
        : { text: court.name },
      { text: this.formatDate(court.lastUpdatedAt) },
      ...(filters.includeClosed ? [{ text: court.open ? 'Open' : 'Closed' }] : []),
      {
        classes: 'homepage-courts-table__actions',
        html: this.buildActionsHtml(court, isReviewMode),
      },
    ]);
  }

  public buildFavouriteTableHead(): HomePageTableHeadCell[] {
    return [{ text: 'Name' }, { text: 'Last updated' }, { classes: 'homepage-courts-table__actions', text: 'Actions' }];
  }

  public buildFavouriteTableRows(
    filters: HomePageFilters,
    favouritesPage: PagedCourts,
    isReviewMode = false
  ): HomePageTableCell[][] {
    const returnPath = this.buildFavouritesHref(filters, favouritesPage.page.number);

    return favouritesPage.content.map(location => [
      this.buildNameCell(location, true, returnPath, 'favourites'),
      { text: this.formatDate(location.lastUpdatedAt) },
      {
        classes: 'homepage-courts-table__actions',
        html: this.buildActionsHtml(location, isReviewMode),
      },
    ]);
  }

  /**
   * Builds the pagination view model for the current results page.
   */
  public buildPagination(courtsPage: PagedCourts, filters: HomePageFilters): HomePagePagination {
    const totalPages = courtsPage.page.totalPages ?? 0;
    const currentPage = courtsPage.page.number ?? filters.pageNumber;
    const items = this.buildPaginationItems(totalPages, currentPage, filters);

    return {
      currentPage,
      items,
      next:
        currentPage < totalPages - 1 ? { href: this.buildHref(filters, { pageNumber: currentPage + 1 }) } : undefined,
      previous: currentPage > 0 ? { href: this.buildHref(filters, { pageNumber: currentPage - 1 }) } : undefined,
      totalPages,
    };
  }

  public buildFavouritesPagination(favouritesPage: PagedCourts, filters: HomePageFilters): HomePagePagination {
    const totalPages = favouritesPage.page.totalPages ?? 0;
    const currentPage = favouritesPage.page.number ?? filters.favouritesPageNumber ?? DEFAULT_PAGE_NUMBER;
    const pageIndexes = this.getVisiblePageIndexes(totalPages, currentPage);
    const items: HomePagePaginationLink[] = [];

    pageIndexes.forEach((pageIndex, index) => {
      if (index > 0 && pageIndex - pageIndexes[index - 1] > 1) {
        items.push({ ellipsis: true, href: '', number: -1 });
      }
      items.push({
        current: pageIndex === currentPage,
        href: this.buildFavouritesHref(filters, pageIndex),
        number: pageIndex + 1,
      });
    });

    return {
      currentPage,
      items: totalPages > 1 ? items : [],
      next: currentPage < totalPages - 1 ? { href: this.buildFavouritesHref(filters, currentPage + 1) } : undefined,
      previous: currentPage > 0 ? { href: this.buildFavouritesHref(filters, currentPage - 1) } : undefined,
      totalPages,
    };
  }

  /**
   * Builds the page title, including validation and pagination context when needed.
   */
  public buildPageTitle(courtsPage: PagedCourts, hasValidationErrors: boolean): string {
    const titlePrefix = hasValidationErrors ? 'Error: ' : '';

    if ((courtsPage.page.totalPages ?? 0) > 1) {
      return `${titlePrefix}${HOME_PAGE_TITLE} (page ${(courtsPage.page.number ?? DEFAULT_PAGE_NUMBER) + 1} of ${courtsPage.page.totalPages})`;
    }

    return `${titlePrefix}${HOME_PAGE_TITLE}`;
  }

  public buildFavouritesPageTitle(favouritesPage: PagedCourts): string {
    return (favouritesPage.page.totalPages ?? 0) > 1
      ? `Favourites (page ${(favouritesPage.page.number ?? DEFAULT_PAGE_NUMBER) + 1} of ${favouritesPage.page.totalPages})`
      : 'Favourites';
  }

  /**
   * Builds the summary text shown above the results table.
   */
  public buildResultsMessage(courtsPage: PagedCourts): string {
    const totalElements = courtsPage.page.totalElements ?? 0;

    if (totalElements === 0 || courtsPage.content.length === 0) {
      return DEFAULT_RESULTS_MESSAGE;
    }

    return `Showing ${(courtsPage.page.number ?? DEFAULT_PAGE_NUMBER) * (courtsPage.page.size ?? DEFAULT_PAGE_SIZE) + 1} to ${(courtsPage.page.number ?? DEFAULT_PAGE_NUMBER) * (courtsPage.page.size ?? DEFAULT_PAGE_SIZE) + courtsPage.content.length} of ${totalElements} courts, tribunals and service centres`;
  }

  public buildFavouritesResultsMessage(favouritesPage: PagedCourts): string {
    const totalElements = favouritesPage.page.totalElements ?? 0;
    if (totalElements === 0 || favouritesPage.content.length === 0) {
      return 'No favourite courts, tribunals or service centres found.';
    }

    const pageNumber = favouritesPage.page.number ?? DEFAULT_PAGE_NUMBER;
    const pageSize = favouritesPage.page.size ?? DEFAULT_PAGE_SIZE;
    return `Showing ${pageNumber * pageSize + 1} to ${pageNumber * pageSize + favouritesPage.content.length} of ${totalElements} favourite courts, tribunals and service centres`;
  }

  /**
   * Builds the row action list.
   */
  private buildActionsHtml(location: LocationListItem, isReviewMode: boolean): string {
    const escapedName = this.escapeHtml(location.name);
    const viewLink = `<li class="govuk-summary-list__actions-list-item"><a class="govuk-link govuk-link--no-visited-state" href="${this.buildPublicLocationHref(location)}">View<span class="govuk-visually-hidden"> ${escapedName}</span></a></li>`;
    const editPathPrefix =
      location.serviceCentre || location.locationType === 'SERVICE_CENTRE' ? 'service-centres' : 'courts';
    const editLabel = isReviewMode ? 'Review' : 'Edit';
    const editLink = `<li class="govuk-summary-list__actions-list-item"><a class="govuk-link govuk-link--no-visited-state" href="/${editPathPrefix}/${location.id}/edit">${editLabel}<span class="govuk-visually-hidden"> ${escapedName}</span></a></li>`;

    return `<ul class="govuk-summary-list__actions-list govuk-!-margin-bottom-0">${viewLink}${editLink}</ul>`;
  }

  /**
   * Builds the region select options, including the default All regions option.
   */
  public buildRegionOptions(regions: Region[], selectedRegionId: string): HomePageRegionOption[] {
    return [
      {
        selected: selectedRegionId === '',
        text: 'All regions',
        value: '',
      },
      ...regions.map(region => ({
        selected: region.id === selectedRegionId,
        text: region.name,
        value: region.id,
      })),
    ];
  }

  /**
   * Builds the condensed GOV.UK pagination item list with ellipses where ranges are skipped.
   */
  private buildPaginationItems(
    totalPages: number,
    currentPage: number,
    filters: HomePageFilters
  ): HomePagePaginationLink[] {
    if (totalPages <= 1) {
      return [];
    }

    return this.buildPaginationItemsFromIndexes(
      this.getVisiblePageIndexes(totalPages, currentPage),
      currentPage,
      filters
    );
  }

  /**
   * Returns the sorted page indexes that should be visible in the condensed pagination control.
   */
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

  /**
   * Maps visible page indexes into GOV.UK pagination items, inserting ellipses where ranges are skipped.
   */
  private buildPaginationItemsFromIndexes(
    pageIndexes: number[],
    currentPage: number,
    filters: HomePageFilters
  ): HomePagePaginationLink[] {
    const items: HomePagePaginationLink[] = [];

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

  /**
   * Builds a homepage URL for a sortable column, toggling sort order when the column is already active.
   */
  private buildSortHref(filters: HomePageFilters, sortBy: 'lastUpdated' | 'name'): string {
    return this.buildHref(filters, {
      pageNumber: DEFAULT_PAGE_NUMBER,
      sortBy,
      sortOrder: filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  }

  /**
   * Builds a homepage URL with the current filters plus any pagination or sorting overrides.
   */
  private buildHref(filters: HomePageFilters, overrides: HomePageHrefOverrides): string {
    return `/?${this.buildCourtQuery(filters, overrides).toString()}`;
  }

  private buildCourtQuery(filters: HomePageFilters, overrides: HomePageHrefOverrides): URLSearchParams {
    const query = new URLSearchParams();
    const pageNumber = overrides.pageNumber ?? filters.pageNumber;
    const sortBy = overrides.sortBy ?? filters.sortBy;
    const sortOrder = overrides.sortOrder ?? filters.sortOrder;
    const optionalQueryParams = [
      ['partialCourtName', filters.partialCourtName],
      ['regionId', filters.regionId],
      ['includeClosed', filters.includeClosed ? 'true' : ''],
      ['onlyServiceCentres', filters.onlyServiceCentres ? 'true' : ''],
      ['pageSize', filters.pageSize !== DEFAULT_PAGE_SIZE ? filters.pageSize.toString() : ''],
      ['sortBy', sortBy],
      ['sortOrder', sortBy ? sortOrder : ''],
    ] as const;

    optionalQueryParams.forEach(([key, value]) => {
      if (value) {
        query.set(key, value);
      }
    });

    query.set('pageNumber', pageNumber.toString());

    return query;
  }

  private buildFavouritesHref(filters: HomePageFilters, favouritesPageNumber: number): string {
    const query = this.buildCourtQuery(filters, { pageNumber: filters.pageNumber });
    query.set('tab', 'favourites');
    query.set('favouritesPageNumber', favouritesPageNumber.toString());
    return `/?${query.toString()}#favourites`;
  }

  /**
   * Builds the public frontend location URL used by the View action link.
   */
  private buildPublicLocationHref(location: LocationListItem): string {
    const pathPrefix =
      location.serviceCentre || location.locationType === 'SERVICE_CENTRE' ? 'service-centres' : 'courts';

    return `${PUBLIC_FRONTEND_URL.replace(/\/$/, '')}/${pathPrefix}/${location.slug}`;
  }

  /**
   * Builds a sortable table heading cell with the correct aria-sort state and next-sort hint.
   */
  private buildSortableHeadItem(
    label: string,
    sortBy: 'lastUpdated' | 'name',
    filters: HomePageFilters
  ): HomePageTableHeadCell {
    const isCurrentSort = filters.sortBy === sortBy;
    const ariaSort = isCurrentSort ? (filters.sortOrder === 'desc' ? 'descending' : 'ascending') : 'none';
    const nextSortOrder = isCurrentSort && filters.sortOrder === 'asc' ? 'descending' : 'ascending';

    return {
      attributes: {
        'aria-sort': ariaSort,
      },
      html: `<a class="homepage-sort-link govuk-link govuk-link--no-visited-state" href="${this.buildSortHref(filters, sortBy)}">${label}${this.getSortIconSvg(
        ariaSort
      )}<span class="govuk-visually-hidden">, sort ${nextSortOrder}</span></a>`,
    };
  }

  /**
   * Returns the inline SVG used to represent the current sort state.
   */
  private getSortIconSvg(ariaSort: 'ascending' | 'descending' | 'none'): string {
    return [
      '<svg class="homepage-sort-icon" width="22" height="22" focusable="false" aria-hidden="true" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">',
      SORT_ICON_PATHS[ariaSort],
      '</svg>',
    ].join('');
  }

  /**
   * Formats an ISO date string for display in the homepage results table.
   */
  private formatDate(date: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date));
  }

  private buildNameCell(
    location: LocationListItem,
    favourite: boolean,
    returnPath: string,
    table: 'courts' | 'favourites'
  ): HomePageTableCell {
    const tooltip = favourite ? 'Remove from favourites' : 'Add to favourites';
    const action = `/favourites/${location.locationType}/${location.id}${favourite ? '/remove' : ''}`;
    const tooltipId = `favourite-tooltip-${table}-${location.locationType.toLowerCase()}-${location.id}`;
    const escapedName = this.escapeHtml(location.name);
    const escapedReturnPath = this.escapeHtml(returnPath);
    const accessibleLabel = favourite
      ? `Remove ${escapedName} from favourites`
      : `Add ${escapedName} to favourites`;

    return {
      html: [
        '<div class="favourite-location">',
        `<form class="favourite-location__form" method="post" action="${action}">`,
        `<input type="hidden" name="returnPath" value="${escapedReturnPath}">`,
        `<button class="favourite-location__button" type="submit" aria-pressed="${favourite}" aria-describedby="${tooltipId}">`,
        '<svg class="favourite-location__star" aria-hidden="true" focusable="false" viewBox="0 0 24 24">',
        '<path d="M12 2.6l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.42l-5.8 3.05L7.31 14l-4.7-4.58 6.49-.94L12 2.6z"/>',
        '</svg>',
        `<span class="govuk-visually-hidden">${accessibleLabel}</span>`,
        '</button>',
        `<span class="favourite-location__tooltip" id="${tooltipId}" role="tooltip">${tooltip}</span>`,
        '</form>',
        `<span class="favourite-location__name">${escapedName}</span>`,
        '</div>',
      ].join(''),
    };
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}

export function buildFavouriteKey(subjectType: string, subjectId: string): string {
  return `${subjectType}:${subjectId}`;
}
