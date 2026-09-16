import { GetAuditsParams } from '../requests/types/GetAuditsParams';
import {
  AUDIT_FILTER_CATEGORY_LABELS,
  AUDIT_FILTER_ITEM_LABELS,
  INCLUDED_AUDIT_FILTER_CATEGORIES,
} from '../utils/constants/messageConstants';
import { hasValue, parseDate, toJsDateString } from '../utils/valueParsers';

export type FilterCategory = {
  heading: { text: string };
  items: { text: string; href: string }[];
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
      ([key, value]) =>
        INCLUDED_AUDIT_FILTER_CATEGORIES.has(key) && hasValue(value) && !this.isHiddenFromDate(key, value)
    );

    const grouped = new Map<string, { key: string; itemText: string }[]>();

    for (const [key] of entries) {
      const categoryLabel = AUDIT_FILTER_CATEGORY_LABELS[key] ?? key;
      const itemText =
        key === 'subjectType'
          ? `${AUDIT_FILTER_ITEM_LABELS[key]} (${filters.subjectType?.replaceAll('_', ' ')})`
          : (AUDIT_FILTER_ITEM_LABELS[key] ?? categoryLabel);
      const current = grouped.get(categoryLabel) ?? [];
      current.push({ key, itemText });
      grouped.set(categoryLabel, current);
    }

    const categories: FilterCategory[] = [];

    for (const [categoryLabel, groupEntries] of grouped) {
      const items = groupEntries.map(({ key, itemText }) => {
        const params = new URLSearchParams(
          Object.entries(filters)
            .filter(([candidateKey, candidateValue]) => candidateKey !== key && hasValue(candidateValue))
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

  private isHiddenFromDate(key: string, value: unknown): boolean {
    if (key !== 'fromDate') {
      return false;
    }

    const normalizedFromDate = toJsDateString(parseDate(String(value)));
    const today = toJsDateString(new Date());

    return normalizedFromDate !== undefined && today !== undefined && normalizedFromDate === today;
  }
}
