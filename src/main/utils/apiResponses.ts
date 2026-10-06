import { HttpStatusCode } from 'axios';

export type ValidationErrorRecordOptions = {
  ignoredKeys?: readonly string[];
  mapKey?: (key: string) => string;
};

export function isHttpStatusCode(value: unknown): value is HttpStatusCode {
  return typeof value === 'number';
}

export function isSuccessfulHttpStatus(value: unknown): value is HttpStatusCode {
  return isHttpStatusCode(value) && value >= HttpStatusCode.Ok && value < HttpStatusCode.MultipleChoices;
}

export function toValidationErrorRecord(
  apiErrors: ReadonlyMap<string, string>,
  options: ValidationErrorRecordOptions = {}
): Record<string, string[]> {
  const ignoredKeys = new Set((options.ignoredKeys ?? []).map(key => key.toLowerCase()));

  return Object.fromEntries(
    [...apiErrors.entries()]
      .filter(([key]) => !ignoredKeys.has(key.toLowerCase()))
      .map(([key, message]) => [options.mapKey?.(key) ?? key, [message]])
  );
}

export function toSingleValidationErrorRecord(apiErrors: ReadonlyMap<string, string>): Record<string, string> {
  return Object.fromEntries(apiErrors);
}
