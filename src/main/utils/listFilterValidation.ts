import { parseNumber } from './valueParsers';

export type ListFilterValidationError = {
  href: string;
  text: string;
};

export type IntegerQueryValidationOptions = {
  href: string;
  maximum: number;
  maximumError: string;
  minimum: number;
  minimumError: string;
};

export function parseClampedNumber(value: unknown, fallback: number, maximum: number): number {
  return Math.min(parseNumber(value, fallback), maximum);
}

export function validateIntegerQueryParameter(
  rawValue: string | undefined,
  options: IntegerQueryValidationOptions
): ListFilterValidationError | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < options.minimum) {
    return { href: options.href, text: options.minimumError };
  }
  if (value > options.maximum) {
    return { href: options.href, text: options.maximumError };
  }

  return undefined;
}

export function validateSortParameters(
  rawSortBy: string | undefined,
  rawSortOrder: string | undefined,
  allowedSortBy: readonly string[],
  sortOrderWithoutSortByError: string,
  href = '#main-content'
): ListFilterValidationError[] {
  const errors: ListFilterValidationError[] = [];

  if (rawSortOrder !== undefined && rawSortBy === undefined) {
    errors.push({ href, text: sortOrderWithoutSortByError });
  }
  if (rawSortBy !== undefined && !allowedSortBy.includes(rawSortBy)) {
    errors.push({ href, text: `sortBy must be one of: ${allowedSortBy.join(', ')}` });
  }
  if (rawSortOrder !== undefined && rawSortOrder !== 'asc' && rawSortOrder !== 'desc') {
    errors.push({ href, text: 'sortOrder must be one of: asc, desc' });
  }

  return errors;
}
