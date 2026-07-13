import { HomePageFiltersService } from '../../../main/services/HomePageFiltersService';
import { HomePageFilters } from '../../../main/services/types/HomePage.types';

describe('HomePageFiltersService', () => {
  const service = new HomePageFiltersService();
  const regions = [{ country: 'England', id: '11111111-1111-4111-8111-111111111111', name: 'London' }];

  test('parses filters and preserves raw values used for validation', () => {
    expect(
      service.getFilters({
        includeClosed: 'on',
        onlyServiceCentres: 'true',
        pageNumber: '3',
        pageSize: '50',
        partialCourtName: 'London',
        regionId: regions[0].id,
        sortBy: 'unsupported',
        sortOrder: 'desc',
      })
    ).toEqual({
      includeClosed: true,
      onlyServiceCentres: true,
      pageNumber: 3,
      pageSize: 50,
      partialCourtName: 'London',
      rawIncludeClosed: 'on',
      rawOnlyServiceCentres: 'true',
      rawPageNumber: '3',
      rawPageSize: '50',
      rawSortBy: 'unsupported',
      rawSortOrder: 'desc',
      regionId: regions[0].id,
      sortBy: '',
      sortOrder: 'desc',
    });
  });

  test('returns validation errors for invalid filter values', () => {
    const filters = service.getFilters({
      includeClosed: 'maybe',
      onlyServiceCentres: 'yes',
      pageNumber: '-1',
      pageSize: '1001',
      partialCourtName: 'London!',
      regionId: 'not-a-uuid',
      sortBy: 'createdAt',
      sortOrder: 'sideways',
    });

    expect(service.validateFilters(filters, regions)).toEqual([
      {
        href: '#partialCourtName',
        text: 'Court or tribunal name must only include letters, spaces, brackets, apostrophes, hyphens and ampersands.',
      },
      { href: '#main-content', text: 'includeClosed must be true or false' },
      { href: '#main-content', text: 'onlyServiceCentres must be true or false' },
      { href: '#main-content', text: 'pageSize must be less than or equal to 1000' },
      { href: '#main-content', text: 'pageNumber must be greater than or equal to 0' },
      { href: '#regionId', text: 'Region must be a valid UUID' },
      { href: '#main-content', text: 'sortBy must be one of: lastUpdated, name' },
      { href: '#main-content', text: 'sortOrder must be one of: asc, desc' },
    ]);
  });

  test('validates sort order without sort by and unknown regions', () => {
    const filters = service.getFilters({
      regionId: '22222222-2222-4222-8222-222222222222',
      sortOrder: 'desc',
    });

    expect(service.validateFilters(filters, regions)).toEqual([
      { href: '#regionId', text: 'Region must be a valid region' },
      { href: '#main-content', text: 'sortOrder cannot be provided without sortBy' },
    ]);
  });

  test('maps filters to API params and omits empty optional params', () => {
    const filters: HomePageFilters = {
      includeClosed: true,
      onlyServiceCentres: true,
      pageNumber: 2,
      pageSize: 10,
      partialCourtName: 'London',
      rawIncludeClosed: 'true',
      rawOnlyServiceCentres: 'true',
      rawPageNumber: '2',
      rawPageSize: '10',
      rawSortBy: 'name',
      rawSortOrder: 'asc',
      regionId: regions[0].id,
      sortBy: 'name',
      sortOrder: 'asc',
    };

    expect(service.toGetCourtsParams(filters)).toEqual({
      includeClosed: true,
      onlyServiceCentres: true,
      pageNumber: 2,
      pageSize: 10,
      partialCourtName: 'London',
      regionId: regions[0].id,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(
      service.toGetCourtsParams({
        ...filters,
        partialCourtName: '',
        regionId: '',
        sortBy: '',
      })
    ).toEqual({
      includeClosed: true,
      onlyServiceCentres: true,
      pageNumber: 2,
      pageSize: 10,
    });
  });
});
