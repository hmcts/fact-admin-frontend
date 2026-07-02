export type BreadcrumbItem = {
  href?: string;
  text: string;
};

export function buildEditBreadcrumbs(courtId: string, courtName: string): BreadcrumbItem[] {
  return [
    { href: '/', text: 'Home' },
    { href: `/courts/${courtId}/edit`, text: `Edit ${courtName}` },
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
    ...buildEditBreadcrumbs(courtId, courtName),
    { href: `/courts/${courtId}/edit/${sectionPath}`, text: sectionText },
  ];

  if (currentPage) {
    breadcrumbs.push({ text: currentPage, href: '#' });
  }

  return breadcrumbs;
}
