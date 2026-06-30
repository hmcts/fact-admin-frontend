import { env } from '../../../testUtils/nunjucksHelper';

describe('Home View', () => {
  test('renders the homepage with the default empty-state content', () => {
    const html = env.render('home.njk', {
      courtTableHead: [],
      courtTableRows: [],
      errorSummary: [],
      filters: {
        includeClosed: false,
        pageNumber: 0,
        pageSize: 25,
        partialCourtName: '',
        regionId: '',
        sortBy: '',
        sortOrder: 'asc',
      },
      includeStatusColumn: false,
      pagePath: '/',
      pageTitle: 'Courts and tribunals',
      pagination: {
        currentPage: 0,
        items: [],
        totalPages: 0,
      },
      partialCourtNameError: undefined,
      regionOptions: [{ selected: true, text: 'All regions', value: '' }],
      resultsMessage: 'No courts found.',
    });

    expect(html).toContain('Courts and tribunals');
    expect(html).toContain('Apply filters');
    expect(html).toContain('Clear filters');
    expect(html).toContain('No courts found.');
    expect(html).toContain('No courts match the current filters.');
  });

  test('renders error summary and pagination when provided', () => {
    const html = env.render('home.njk', {
      courtTableHead: [{ text: 'Name' }, { text: 'Actions' }],
      courtTableRows: [[{ text: 'Reading Crown Court' }, { text: 'Edit' }]],
      errorMessage: 'There was a problem loading courts.',
      errorSummary: [{ href: '#partialCourtName', text: 'Enter a court name' }],
      filters: {
        includeClosed: false,
        pageNumber: 0,
        pageSize: 25,
        partialCourtName: 'Reading',
        regionId: '',
        sortBy: 'name',
        sortOrder: 'asc',
      },
      includeStatusColumn: false,
      pagePath: '/',
      pageTitle: 'Courts and tribunals',
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
      resultsMessage: 'Showing 1 to 1 of 1 courts',
    });

    expect(html).toContain('There is a problem');
    expect(html).toContain('Enter a court name');
    expect(html).toContain('There was a problem loading courts.');
    expect(html).toContain('href="/?pageNumber=1"');
  });
});
