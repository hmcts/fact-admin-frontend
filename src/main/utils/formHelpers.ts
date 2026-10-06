export type ErrorSummaryItem = {
  href: string;
  text: string;
};

export type SplitColumns<T> = {
  left: T[];
  right: T[];
};

export function normaliseSelectedValues(value: unknown, options: { splitCommas?: boolean } = {}): string[] {
  if (Array.isArray(value)) {
    return value.filter((selectedValue): selectedValue is string => typeof selectedValue === 'string');
  }

  if (typeof value !== 'string') {
    return [];
  }

  return options.splitCommas ? value.split(',') : [value];
}

export function toErrorSummary(
  errors: Record<string, string>,
  hrefForField: (field: string) => string = field => `#${field}`
): ErrorSummaryItem[] {
  return Object.entries(errors).map(([field, text]) => ({ href: hrefForField(field), text }));
}

export function sortAndSplitIntoColumns<T>(items: readonly T[], labelSelector: (item: T) => string): SplitColumns<T> {
  const sortedItems = [...items].sort((left, right) => labelSelector(left).localeCompare(labelSelector(right)));
  const midpoint = Math.ceil(sortedItems.length / 2);

  return {
    left: sortedItems.slice(0, midpoint),
    right: sortedItems.slice(midpoint),
  };
}
