import { Subject, SubjectType } from '../../schemas/subjectTypeSchema';

export type BreadcrumbItem = {
  href?: string;
  text: string;
};

export function buildEditBreadcrumbs(
  subjectId: string,
  subjectName: string,
  subjectType: Subject = SubjectType.COURT
): BreadcrumbItem[] {
  return [
    { href: '/', text: 'Home' },
    {
      href: `/${subjectType === SubjectType.COURT ? 'courts' : 'service-centres'}/${subjectId}/edit`,
      text: `Edit ${subjectName}`,
    },
  ];
}

export function buildSectionBreadcrumbs(
  courtId: string,
  courtName: string,
  sectionText: string,
  sectionPath: string,
  currentPage?: string,
  subjectType: Subject = SubjectType.COURT
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    ...buildEditBreadcrumbs(courtId, courtName, subjectType),
    {
      href: `/${subjectType === SubjectType.COURT ? 'courts' : 'service-centres'}/${courtId}/edit/${sectionPath}`,
      text: sectionText,
    },
  ];

  if (currentPage) {
    breadcrumbs.push({ text: currentPage, href: '#' });
  }

  return breadcrumbs;
}
