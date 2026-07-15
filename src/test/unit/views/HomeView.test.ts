import { env } from '../../../testUtils/nunjucksHelper';

describe('Home View', () => {
  test('renders the homepage with the default empty-state content', () => {
    const html = env.render('home.njk', {
      courtTableHead: [],
      courtTableRows: [],
      errorSummary: [],
      favouriteTableHead: [],
      favouriteTableRows: [],
      favouritesPagination: { currentPage: 0, items: [], totalPages: 0 },
      favouritesResultsMessage: 'No favourite courts, tribunals or service centres found.',
      filters: {
        activeTab: 'courts',
        favouritesPageNumber: 0,
        includeClosed: false,
        onlyServiceCentres: false,
        pageNumber: 0,
        pageSize: 25,
        partialCourtName: '',
        regionId: '',
        sortBy: '',
        sortOrder: 'asc',
      },
      includeStatusColumn: false,
      pagePath: '/',
      pageTitle: 'Courts, tribunals and service centres',
      pagination: {
        currentPage: 0,
        items: [],
        totalPages: 0,
      },
      partialCourtNameError: undefined,
      regionOptions: [{ selected: true, text: 'All regions', value: '' }],
      resultsMessage: 'No courts, tribunals or service centres found.',
    });

    expect(html).toContain('Courts, tribunals and service centres');
    expect(html).toContain('Apply filters');
    expect(html).toContain('Clear filters');
    expect(html).toContain('Search courts, tribunals and service centres');
    expect(html).toContain('Only show service centres');
    expect(html).toContain('No courts, tribunals or service centres found.');
    expect(html).toContain('No courts, tribunals or service centres match the current filters.');
  });

  test('renders error summary and pagination when provided', () => {
    const html = env.render('home.njk', {
      courtTableHead: [{ text: 'Name' }, { text: 'Actions' }],
      courtTableRows: [[{ text: 'Reading Crown Court' }, { text: 'Edit' }]],
      errorMessage: 'There was a problem loading courts, tribunals and service centres.',
      errorSummary: [{ href: '#partialCourtName', text: 'Enter a court name' }],
      favouriteTableHead: [],
      favouriteTableRows: [],
      favouritesPagination: { currentPage: 0, items: [], totalPages: 0 },
      favouritesResultsMessage: 'No favourite courts, tribunals or service centres found.',
      filters: {
        activeTab: 'courts',
        favouritesPageNumber: 0,
        includeClosed: false,
        onlyServiceCentres: false,
        pageNumber: 0,
        pageSize: 25,
        partialCourtName: 'Reading',
        regionId: '',
        sortBy: 'name',
        sortOrder: 'asc',
      },
      includeStatusColumn: false,
      pagePath: '/',
      pageTitle: 'Courts, tribunals and service centres',
      pagination: {
        currentPage: 0,
        items: [
          { current: true, href: '/?pageNumber=0', number: 1 },
          { href: '/?pageNumber=1', number: 2 },
        ],
        next: { href: '/?pageNumber=1' },
        totalPages: 2,
      },
      partialCourtNameError: 'Enter a court name',
      regionOptions: [{ selected: true, text: 'All regions', value: '' }],
      resultsMessage: 'Showing 1 to 1 of 1 courts, tribunals and service centres',
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Enter a court name');
    expect(html).toContain('There was a problem loading courts, tribunals and service centres.');
    expect(html).toContain('href="/?pageNumber=1"');
  });

  test('renders the active Favourites table and its independent error', () => {
    const html = env.render('home.njk', {
      courtTableHead: [],
      courtTableRows: [],
      errorSummary: [],
      favouriteTableHead: [{ text: 'Name' }, { text: 'Last updated' }, { text: 'Actions' }],
      favouriteTableRows: [[{ html: 'Favourite Court star' }, { text: '14 Jul 2026' }, { text: 'Review' }]],
      favouritesErrorMessage: 'There was a problem loading favourites.',
      favouritesPagination: { currentPage: 0, items: [], totalPages: 0 },
      favouritesResultsMessage: 'Showing 1 to 1 of 1 favourite courts, tribunals and service centres',
      filters: {
        activeTab: 'favourites',
        favouritesPageNumber: 0,
        includeClosed: false,
        onlyServiceCentres: false,
        pageNumber: 0,
        pageSize: 25,
        partialCourtName: '',
        regionId: '',
        sortBy: '',
        sortOrder: 'asc',
      },
      includeStatusColumn: false,
      pagePath: '/',
      pageTitle: 'Favourites',
      pagination: { currentPage: 0, items: [], totalPages: 0 },
      regionOptions: [],
      resultsMessage: 'No courts, tribunals or service centres found.',
    });

    expect(html).toContain('Favourites');
    expect(html).toContain('There was a problem loading favourites.');
    expect(html).toMatch(/govuk-tabs__list-item govuk-tabs__list-item--selected[^>]*>\s*<a[^>]*>Favourites<\/a>/);
    expect(html).toContain('govuk-tabs__panel govuk-tabs__panel--hidden" id="courts"');
    expect(html).toContain('govuk-tabs__panel" id="favourites"');
  });
});
