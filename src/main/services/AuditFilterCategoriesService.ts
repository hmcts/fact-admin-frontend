import { GetAuditsParams } from '../requests/types/GetAuditsParams';
import { parseDate, toJsDateString } from '../utils/valueParsers';

export type FilterCategory = {
  heading: { text: string };
  items: { text: string; href: string }[];
};

const INCLUDED_CATEGORIES = new Set(['email', 'subjectType', 'courtId', 'serviceCentreId', 'fromDate', 'toDate']);

const CATEGORY_LABELS: Record<string, string> = {
  email: 'Email address',
  subjectType: 'Subject',
  courtId: 'Subject',
  serviceCentreId: 'Subject',
  fromDate: 'Between',
  toDate: 'Between',
};

const ITEM_LABELS: Record<string, string> = {
  email: 'Email address',
  subjectType: 'Type',
  courtId: 'Court Name',
  serviceCentreId: 'Service Centre Name',
  fromDate: 'From date',
  toDate: 'To date',
};

export class AuditFilterCategoriesService {
  /**
   * builds out the structure of the filter categories in the audit view filter sidebar.
   * For each filter that is present in the query, we want to add it to a category and give it
   * a unique label that, when clicked, will remove that portion of the filter.
   *
   * @param filters
   * @private
   */
  public buildFilterCategories(filters: GetAuditsParams): FilterCategory[] {
    const entries = Object.entries(filters).filter(
      ([key, value]) => INCLUDED_CATEGORIES.has(key) && this.hasValue(value) && !this.isHiddenFromDate(key, value)
    );

    const grouped = new Map<string, { key: string; itemText: string }[]>();

    for (const [key] of entries) {
      const categoryLabel = CATEGORY_LABELS[key] ?? key;
      const itemText =
        key === 'subjectType'
          ? `${ITEM_LABELS[key]} (${filters.subjectType?.replaceAll('_', ' ')})`
          : (ITEM_LABELS[key] ?? categoryLabel);
      const current = grouped.get(categoryLabel) ?? [];
      current.push({ key, itemText });
      grouped.set(categoryLabel, current);
    }

    const categories: FilterCategory[] = [];

    for (const [categoryLabel, groupEntries] of grouped) {
      const items = groupEntries.map(({ key, itemText }) => {
        const params = new URLSearchParams(
          Object.entries(filters)
            .filter(([candidateKey, candidateValue]) => candidateKey !== key && this.hasValue(candidateValue))
            .map(([candidateKey, candidateValue]) => [candidateKey, String(candidateValue)])
        );

        return {
          text: itemText,
          href: `/audits?${params.toString()}`,
        };
      });

      categories.push({
        heading: { text: categoryLabel },
        items,
      });
    }

    return categories;
  }

  private hasValue(value: unknown): boolean {
    return value !== undefined && value !== null && String(value).trim() !== '';
  }

  private isHiddenFromDate(key: string, value: unknown): boolean {
    if (key !== 'fromDate') {
      return false;
    }

    const normalizedFromDate = toJsDateString(parseDate(String(value)));
    const today = toJsDateString(new Date());

    return normalizedFromDate !== undefined && today !== undefined && normalizedFromDate === today;
  }
}
