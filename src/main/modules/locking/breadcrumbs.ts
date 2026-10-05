import { Request } from 'express';

export type BreadcrumbItem = {
  href?: string;
  text: string;
};

const PAGE_LABELS: Record<string, string> = {
  '/add-court': 'Add new court',
  '/add-service-centre': 'Add new service centre',
  '/approvals': 'Approvals tracker',
  '/audits': 'Audits',
  '/users': 'Users',
};

const LOCATION_ROUTE = /^\/(courts|service-centres)\/([^/]+)\/edit(?:\/([^/]+))?(?:\/(.*))?$/;

export function buildBreadcrumbs(
  req: Request,
  view: string,
  renderOptions: Record<string, unknown>
): BreadcrumbItem[] | undefined {
  const addLocationBreadcrumbs = buildAddLocationBreadcrumbs(req.path, view, renderOptions);
  if (addLocationBreadcrumbs) {
    return addLocationBreadcrumbs;
  }

  if (req.path.startsWith('/approvals/')) {
    return [
      homeBreadcrumb(),
      { href: '/approvals', text: PAGE_LABELS['/approvals'] },
      {
        href: '#',
        text: view === 'approval-undo-confirm' ? 'Undo approval' : 'Approval undone',
      },
    ];
  }

  if (req.path.startsWith('/audits/')) {
    return [homeBreadcrumb(), { href: '/audits', text: PAGE_LABELS['/audits'] }, { href: '#', text: 'Audit detail' }];
  }

  const pageLabel = PAGE_LABELS[req.path];
  if (pageLabel) {
    return [homeBreadcrumb(), { href: '#', text: pageLabel }];
  }

  const routeMatch = new RegExp(LOCATION_ROUTE).exec(req.path);
  if (!routeMatch) {
    return undefined;
  }

  return buildLocationBreadcrumbs(routeMatch, view, renderOptions);
}

function buildLocationBreadcrumbs(
  routeMatch: RegExpMatchArray,
  view: string,
  renderOptions: Record<string, unknown>
): BreadcrumbItem[] | undefined {
  const [, routeSegment, subjectId, sectionPath, remainingPath = ''] = routeMatch;
  const subjectName = findString(renderOptions, [
    'subjectName',
    'originalName',
    'courtName',
    'serviceCentreName',
    'name',
  ]);

  if (!subjectName) {
    return undefined;
  }

  const editPath = `/${routeSegment}/${subjectId}/edit`;
  const breadcrumbs: BreadcrumbItem[] = [homeBreadcrumb(), { href: editPath, text: `Edit ${subjectName}` }];

  if (!sectionPath) {
    const currentPage = getEditPageLabel(view);
    if (currentPage) {
      breadcrumbs.push({ href: '#', text: currentPage });
    }

    return breadcrumbs;
  }

  const sectionHref = `${editPath}/${sectionPath}${
    sectionPath === 'address' && renderOptions.isNewSC === true ? '?isNewSC=true' : ''
  }`;

  breadcrumbs.push({
    href: sectionHref,
    text: getSectionLabel(sectionPath),
  });

  const currentPage = getSectionPageLabel(sectionPath, remainingPath, view, renderOptions);
  if (currentPage) {
    breadcrumbs.push({ href: '#', text: currentPage });
  }

  return breadcrumbs;
}

function buildAddLocationBreadcrumbs(
  path: string,
  view: string,
  renderOptions: Record<string, unknown>
): BreadcrumbItem[] | undefined {
  const locationType = new RegExp(/^\/add-(court|service-centre)$/).exec(path)?.[1];

  if (!locationType || view !== `add-${locationType}-success`) {
    return undefined;
  }

  const isCourt = locationType === 'court';
  const subjectId = findString(renderOptions, [isCourt ? 'courtId' : 'serviceCentreId']);
  const subjectName = findString(renderOptions, [isCourt ? 'courtName' : 'serviceCentreName']);

  if (!subjectId || !subjectName) {
    return undefined;
  }

  return [
    homeBreadcrumb(),
    {
      href: `/${isCourt ? 'courts' : 'service-centres'}/${subjectId}/edit`,
      text: subjectName,
    },
    { href: '#', text: getSectionLabel('address') },
  ];
}

function getEditPageLabel(view: string): string | undefined {
  if (view === 'approval-confirm') {
    return 'Approve data';
  }

  if (isSuccessView(view)) {
    return 'Approval saved';
  }

  return undefined;
}

function getSectionPageLabel(
  sectionPath: string,
  remainingPath: string,
  view: string,
  renderOptions: Record<string, unknown>
): string | undefined {

  if (isSuccessView(view)) {
    return getSuccessLabel(sectionPath, remainingPath);
  }

  // edge cases
  if (sectionPath === 'photo' && view.includes('delete-confirm')) {
    return 'Court photo confirm delete';
  }

  if (sectionPath === 'address' && (remainingPath.startsWith('find') || remainingPath.startsWith('select'))) {
    return 'Find address by postcode';
  }

  // action cases
  if (view.includes('delete')) {
    return `Delete ${getActionSubject(sectionPath)}`;
  }

  if (view.includes('edit')) {
    return `Edit ${getActionSubject(sectionPath)}`;
  }

  if (view.includes('confirm')) {
    return `${capitalise(getActionSubject(sectionPath))} confirm update`;
  }

  if (sectionPath === 'contact-details') {
    return findString(renderOptions, ['formHeading']);
  }

  return undefined;
}

function getSuccessLabel(sectionPath: string, remainingPath: string): string {
  if (sectionPath === 'photo') {
    return remainingPath.startsWith('upload') ? 'Court photo confirm update' : 'Court photo confirm delete';
  }

  const isDelete = remainingPath.startsWith('delete/');
  const subject =
    sectionPath === 'counter-service-opening-hours' && !isDelete
      ? humanise(sectionPath)
      : getActionSubject(sectionPath);

  return `${capitalise(subject)} ${isDelete ? 'deleted' : 'saved'}`;
}

function getSectionLabel(sectionPath: string): string {
  if (sectionPath === 'address') {
    return 'Addresses';
  }

  if (sectionPath === 'single-point-of-entry') {
    return 'Single points of entry';
  }

  return capitalise(humanise(sectionPath));
}

function getActionSubject(sectionPath: string): string {
  if (sectionPath === 'court-opening-hours' || sectionPath === 'counter-service-opening-hours') {
    return 'opening hours';
  }

  return humanise(sectionPath);
}

function isSuccessView(view: string): boolean {
  return view.replace(/\.njk$/, '') === 'common-edit-success';
}

function humanise(value: string): string {
  return value
    .replace(/\.njk$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function capitalise(value: string): string {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function findString(value: unknown, keys: string[], visited = new Set<unknown>()): string | undefined {
  if (!value || typeof value !== 'object' || visited.has(value)) {
    return undefined;
  }

  visited.add(value);

  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate;
    }
  }

  for (const nestedValue of Object.values(record)) {
    const result = findString(nestedValue, keys, visited);
    if (result) {
      return result;
    }
  }

  return undefined;
}

function homeBreadcrumb(): BreadcrumbItem {
  return { href: '/', text: 'Home' };
}
