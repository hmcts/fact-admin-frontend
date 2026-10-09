import { buildPagination } from '../../../main/utils/pagination';

describe('buildPagination', () => {
  test('builds condensed items with previous and next links', () => {
    expect(buildPagination(10, 5, page => `/items?page=${page}`)).toEqual({
      items: [
        { current: false, href: '/items?page=0', number: 1 },
        { ellipsis: true, href: '', number: -1 },
        { current: false, href: '/items?page=4', number: 5 },
        { current: true, href: '/items?page=5', number: 6 },
        { current: false, href: '/items?page=6', number: 7 },
        { ellipsis: true, href: '', number: -1 },
        { current: false, href: '/items?page=9', number: 10 },
      ],
      next: { href: '/items?page=6' },
      previous: { href: '/items?page=4' },
      totalPages: 10,
    });
  });

  test('omits items and navigation for a single page', () => {
    expect(buildPagination(1, 0, page => `/items?page=${page}`)).toEqual({
      items: [],
      next: undefined,
      previous: undefined,
      totalPages: 1,
    });
  });
});
