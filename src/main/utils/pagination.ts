export type PaginationLink = {
  current?: boolean;
  ellipsis?: boolean;
  href: string;
  number: number;
};

export type PaginationModel = {
  items: PaginationLink[];
  next?: { href: string };
  previous?: { href: string };
  totalPages: number;
};

export function buildPagination(
  totalPages: number,
  currentPage: number,
  hrefForPage: (pageNumber: number) => string
): PaginationModel {
  const pageIndexes = getVisiblePageIndexes(totalPages, currentPage);
  const items: PaginationLink[] = [];

  if (totalPages > 1) {
    pageIndexes.forEach((pageIndex, index) => {
      if (index > 0 && pageIndex - pageIndexes[index - 1] > 1) {
        items.push({ ellipsis: true, href: '', number: -1 });
      }

      items.push({
        current: pageIndex === currentPage,
        href: hrefForPage(pageIndex),
        number: pageIndex + 1,
      });
    });
  }

  return {
    items,
    next: currentPage < totalPages - 1 ? { href: hrefForPage(currentPage + 1) } : undefined,
    previous: currentPage > 0 ? { href: hrefForPage(currentPage - 1) } : undefined,
    totalPages,
  };
}

function getVisiblePageIndexes(totalPages: number, currentPage: number): number[] {
  const pageIndexes = new Set<number>([0, totalPages - 1, currentPage]);

  if (currentPage > 0) {
    pageIndexes.add(currentPage - 1);
  }
  if (currentPage < totalPages - 1) {
    pageIndexes.add(currentPage + 1);
  }

  return [...pageIndexes].filter(index => index >= 0 && index < totalPages).sort((left, right) => left - right);
}
