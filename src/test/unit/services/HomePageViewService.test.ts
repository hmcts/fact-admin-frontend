import { PagedCourts } from '../../../main/schemas/courtListSchema';
import { HomePageViewService } from '../../../main/services/HomePageViewService';
import { HomePageFilters } from '../../../main/services/types/HomePage.types';

describe('HomePageViewService', () => {
  const service = new HomePageViewService();
  const filters: HomePageFilters = {
    includeClosed: false,
    onlyServiceCentres: false,
    pageNumber: 0,
    pageSize: 25,
    partialCourtName: '',
    rawIncludeClosed: undefined,
    rawOnlyServiceCentres: undefined,
    rawPageNumber: undefined,
    rawPageSize: undefined,
    rawSortBy: undefined,
    rawSortOrder: undefined,
    regionId: '',
    sortBy: '',
    sortOrder: 'asc',
  };
  const court = {
    createdAt: '2026-04-29T09:00:00Z',
    id: '11111111-1111-4111-8111-111111111111',
    lastUpdatedAt: '2026-04-29T10:00:00Z',
    locationType: 'COURT',
    mrdId: 'MRD-123',
    name: 'London Civil and Family Court',
    open: true,
    openOnCath: true,
    regionId: '33333333-3333-4333-8333-333333333333',
    serviceCentre: false,
    slug: 'london-civil-and-family-court',
    warningNotice: null,
  };
  const serviceCentre = {
    ...court,
    id: '22222222-2222-4222-8222-222222222222',
    locationType: 'SERVICE_CENTRE',
    mrdId: null,
    name: 'National Business Centre',
    open: false,
    openOnCath: null,
    serviceCentre: true,
    slug: 'national-business-centre',
  };

  test('builds sortable table headings including status when closed locations are shown', () => {
    const head = service.buildCourtTableHead({
      ...filters,
      includeClosed: true,
      sortBy: 'lastUpdated',
      sortOrder: 'desc',
    });

    expect(head).toHaveLength(4);
    expect(head[0].attributes).toEqual({ 'aria-sort': 'none' });
    expect(head[0].html).toContain('sortBy=name&sortOrder=asc');
    expect(head[1].attributes).toEqual({ 'aria-sort': 'descending' });
    expect(head[1].html).toContain('sortBy=lastUpdated&sortOrder=asc');
    expect(head[2]).toEqual({ text: 'Status' });
    expect(head[3]).toEqual({ classes: 'homepage-courts-table__actions', text: 'Actions' });
  });

  test('builds rows with court and service centre action links', () => {
    const rows = service.buildCourtTableRows(
      {
        ...filters,
        includeClosed: true,
      },
      {
        content: [court, serviceCentre],
        page: {
          number: 0,
          size: 25,
          totalElements: 2,
          totalPages: 1,
        },
      } as PagedCourts
    );

    expect(rows[0][0]).toEqual({ text: 'London Civil and Family Court' });
    expect(rows[0][2]).toEqual({ text: 'Open' });
    expect(rows[0][3].html).toContain('https://localhost:3344/courts/london-civil-and-family-court');
    expect(rows[0][3].html).toContain('/courts/11111111-1111-4111-8111-111111111111/edit');
    expect(rows[1][0]).toEqual({ text: 'National Business Centre' });
    expect(rows[1][2]).toEqual({ text: 'Closed' });
    expect(rows[1][3].html).toContain('https://localhost:3344/service-centres/national-business-centre');
    expect(rows[1][3].html).toContain('/service-centres/22222222-2222-4222-8222-222222222222/edit');
  });

  test('builds review actions for viewer rows', () => {
    const rows = service.buildCourtTableRows(
      filters,
      {
        content: [court, serviceCentre],
        page: {
          number: 0,
          size: 25,
          totalElements: 2,
          totalPages: 1,
        },
      } as PagedCourts,
      true
    );

    expect(rows[0][2].html).toContain('Review<span class="govuk-visually-hidden"> London Civil and Family Court');
    expect(rows[0][2].html).not.toContain('Edit<span');
    expect(rows[1][2].html).toContain('Review<span class="govuk-visually-hidden"> National Business Centre');
  });

  test('builds accessible outline and filled star controls with unique tooltips', () => {
    const rows = service.buildCourtTableRows(
      filters,
      {
        content: [court, serviceCentre],
        page: { number: 0, size: 25, totalElements: 2, totalPages: 1 },
      } as PagedCourts,
      false,
      new Map([
        [`COURT:${court.id}`, false],
        [`SERVICE_CENTRE:${serviceCentre.id}`, true],
      ])
    );

    expect(rows[0][0].html).toContain('aria-pressed="false"');
    expect(rows[0][0].html).toContain('Add to favourites');
    expect(rows[0][0].html).toContain(`action="/favourites/COURT/${court.id}"`);
    expect(rows[0][0].html).toContain(`Add ${court.name} to favourites`);
    expect(rows[1][0].html).toContain('aria-pressed="true"');
    expect(rows[1][0].html).toContain('Remove from favourites');
    expect(rows[1][0].html).toContain(`Remove ${serviceCentre.name} from favourites`);
    expect(rows[1][0].html).toContain(`action="/favourites/SERVICE_CENTRE/${serviceCentre.id}/remove"`);
    expect(rows[0][0].html).not.toContain(`favourite-tooltip-courts-service_centre-${serviceCentre.id}`);
    const nameCellHtml = rows[0][0].html ?? '';
    expect(nameCellHtml.indexOf('favourite-location__form')).toBeLessThan(
      nameCellHtml.indexOf('favourite-location__name')
    );
  });

  test('builds independently paginated favourite rows with Viewer review actions', () => {
    const page = {
      content: [serviceCentre],
      page: { number: 1, size: 25, totalElements: 30, totalPages: 2 },
    } as PagedCourts;
    const rows = service.buildFavouriteTableRows(filters, page, true);
    const pagination = service.buildFavouritesPagination(page, filters);

    expect(rows[0][0].html).toContain('aria-pressed="true"');
    expect(rows[0][0].html).toContain('tab=favourites');
    expect(rows[0][2].html).toContain('Review<span');
    expect(pagination.previous?.href).toContain('favouritesPageNumber=0');
    expect(pagination.previous?.href).toContain('tab=favourites');
    expect(service.buildFavouritesResultsMessage(page)).toBe(
      'Showing 26 to 26 of 30 favourite courts, tribunals and service centres'
    );
    expect(service.buildFavouritesPageTitle(page)).toBe('Favourites (page 2 of 2)');
  });

  test('builds pagination links preserving filters, sorting and service centre checkbox', () => {
    const pagination = service.buildPagination(
      {
        content: [court],
        page: {
          number: 4,
          size: 10,
          totalElements: 100,
          totalPages: 10,
        },
      } as PagedCourts,
      {
        ...filters,
        includeClosed: true,
        onlyServiceCentres: true,
        pageNumber: 4,
        pageSize: 10,
        partialCourtName: 'London',
        regionId: '33333333-3333-4333-8333-333333333333',
        sortBy: 'name',
        sortOrder: 'desc',
      }
    );

    expect(pagination.currentPage).toBe(4);
    expect(pagination.items).toEqual([
      {
        current: false,
        href: '/?partialCourtName=London&regionId=33333333-3333-4333-8333-333333333333&includeClosed=true&onlyServiceCentres=true&pageSize=10&sortBy=name&sortOrder=desc&pageNumber=0',
        number: 1,
      },
      { ellipsis: true, href: '', number: -1 },
      {
        current: false,
        href: '/?partialCourtName=London&regionId=33333333-3333-4333-8333-333333333333&includeClosed=true&onlyServiceCentres=true&pageSize=10&sortBy=name&sortOrder=desc&pageNumber=3',
        number: 4,
      },
      {
        current: true,
        href: '/?partialCourtName=London&regionId=33333333-3333-4333-8333-333333333333&includeClosed=true&onlyServiceCentres=true&pageSize=10&sortBy=name&sortOrder=desc&pageNumber=4',
        number: 5,
      },
      {
        current: false,
        href: '/?partialCourtName=London&regionId=33333333-3333-4333-8333-333333333333&includeClosed=true&onlyServiceCentres=true&pageSize=10&sortBy=name&sortOrder=desc&pageNumber=5',
        number: 6,
      },
      { ellipsis: true, href: '', number: -1 },
      {
        current: false,
        href: '/?partialCourtName=London&regionId=33333333-3333-4333-8333-333333333333&includeClosed=true&onlyServiceCentres=true&pageSize=10&sortBy=name&sortOrder=desc&pageNumber=9',
        number: 10,
      },
    ]);
    expect(pagination.previous?.href).toContain('pageNumber=3');
    expect(pagination.next?.href).toContain('pageNumber=5');
  });

  test('builds page title, results copy and region options', () => {
    const page = {
      content: [court],
      page: {
        number: 1,
        size: 25,
        totalElements: 30,
        totalPages: 2,
      },
    } as PagedCourts;

    expect(service.buildPageTitle(page, true)).toBe('Error: Courts, tribunals and service centres (page 2 of 2)');
    expect(service.buildResultsMessage(page)).toBe('Showing 26 to 26 of 30 courts, tribunals and service centres');
    expect(
      service.buildResultsMessage({
        ...page,
        content: [],
        page: { number: 0, size: 25, totalElements: 0, totalPages: 0 },
      })
    ).toBe('No courts, tribunals or service centres found.');
    expect(
      service.buildRegionOptions(
        [{ country: 'England', id: '33333333-3333-4333-8333-333333333333', name: 'London' }],
        '33333333-3333-4333-8333-333333333333'
      )
    ).toEqual([
      { selected: false, text: 'All regions', value: '' },
      { selected: true, text: 'London', value: '33333333-3333-4333-8333-333333333333' },
    ]);
  });

  test('omits pagination links when there is only one page', () => {
    expect(
      service.buildPagination(
        {
          content: [court],
          page: {
            number: 0,
            size: 25,
            totalElements: 1,
            totalPages: 1,
          },
        } as PagedCourts,
        filters
      )
    ).toEqual({
      currentPage: 0,
      items: [],
      next: undefined,
      previous: undefined,
      totalPages: 1,
    });
  });
});
