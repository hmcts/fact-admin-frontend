import { HttpStatusCode } from 'axios';

export type ValidationErrorRecordOptions = {
  mapKey?: (key: string) => string;
};

const DEFAULT_IGNORED_VALIDATION_ERROR_KEYS = new Set(['timestamp']);

export function isHttpStatusCode(value: unknown): value is HttpStatusCode {
  return typeof value === 'number';
}

export function isSuccessfulHttpStatus(value: unknown): value is HttpStatusCode {
  return isHttpStatusCode(value) && value >= HttpStatusCode.Ok && value < HttpStatusCode.MultipleChoices;
}

export function toValidationErrorEntries(
  apiErrors: ReadonlyMap<string, string>,
  options: ValidationErrorRecordOptions = {}
): [string, string][] {
  return [...apiErrors.entries()]
    .filter(([key]) => !DEFAULT_IGNORED_VALIDATION_ERROR_KEYS.has(key.toLowerCase()))
    .map(([key, message]) => [options.mapKey?.(key) ?? key, message]);
}

export function toValidationErrorRecord(
  apiErrors: ReadonlyMap<string, string>,
  options: ValidationErrorRecordOptions = {}
): Record<string, string[]> {
  return Object.fromEntries(toValidationErrorEntries(apiErrors, options).map(([key, message]) => [key, [message]]));
}

export function toSingleValidationErrorRecord(apiErrors: ReadonlyMap<string, string>): Record<string, string> {
  return Object.fromEntries(apiErrors);
}
