export type BreadcrumbItem = {
  href?: string;
  text: string;
};

export function buildEditBreadcrumbs(courtId: string, courtName: string, currentPage = 'Edit'): BreadcrumbItem[] {
  return [
    { href: '/', text: 'Home' },
    { href: `/courts/${courtId}/edit`, text: courtName },
    { text: currentPage, href: '#' },
  ];
}

export function buildSectionBreadcrumbs(
  courtId: string,
  courtName: string,
  sectionText: string,
  sectionPath: string,
  currentPage?: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { href: '/', text: 'Home' },
    { href: `/courts/${courtId}/edit`, text: courtName },
    { href: `/courts/${courtId}/edit/${sectionPath}`, text: sectionText },
  ];

  if (currentPage) {
    breadcrumbs.push({ text: currentPage, href: '#' });
  }

  return breadcrumbs;
}
