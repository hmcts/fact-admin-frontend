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

// TODO: when the locking PR goes in, normalise this file to work for both subject types

export function buildServiceCentreEditBreadcrumbs(
  serviceCentreId: string,
  serviceCentreName: string
): BreadcrumbItem[] {
  return [
    { href: '/', text: 'Home' },
    { href: `/service-centres/${serviceCentreId}/edit`, text: `Edit ${serviceCentreName}` },
  ];
}

export function buildServiceCentreSectionBreadcrumbs(
  serviceCentreId: string,
  serviceCentreName: string,
  sectionText: string,
  sectionPath: string,
  currentPage?: string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    ...buildServiceCentreEditBreadcrumbs(serviceCentreId, serviceCentreName),
    { href: `/service-centres/${serviceCentreId}/edit/${sectionPath}`, text: sectionText },
  ];

  if (currentPage) {
    breadcrumbs.push({ text: currentPage, href: '#' });
  }

  return breadcrumbs;
}
