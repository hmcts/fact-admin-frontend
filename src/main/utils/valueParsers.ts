import moment from 'moment-timezone';

const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const UK_TIME_ZONE = 'Europe/London';

/**
 * Parses an integer-like value, falling back when the value is invalid.
 */
export function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

/**
 * Parses a required string-like value, returning an empty string when absent.
 */
export function parseString(value: unknown): string {
  const parsed = parseOptionalString(value);

  return parsed ?? '';
}

/**
 * Parses an optional string-like value.
 */
export function parseOptionalString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find((entry): entry is string => typeof entry === 'string');
  }

  return undefined;
}

/**
 * Checks whether a value is a UUID in the format expected by the API.
 */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
};

export const parseLiftMetric = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : NaN;
};

/**
 * Converts the passed in Date into a string in the format yyyy-MM-dd which can be parsed
 * as both a js Date and as a LocalDate in Java
 */
export function toJsDateString(value: Date): string | undefined {
  if (!Number.isNaN(value.getTime())) {
    // reminder: getMonth() is 0-based and getDate() is 1-based
    return [value.getFullYear(), value.getMonth() + 1, value.getDate()]
      .map(field => String(field).padStart(2, '0'))
      .join('-');
  }
  return undefined;
}

/**
 * Converts the passed in Date into a string in the format dd/MM/YYYY without padding, for use in
 * the MOJ frontend date input fields.
 */
export function toMojDateString(value: Date): string | undefined {
  if (!Number.isNaN(value.getTime())) {
    // reminder: getMonth() is 0-based and getDate() is 1-based
    return [value.getDate(), value.getMonth() + 1, value.getFullYear()].join('/');
  }
  return undefined;
}

/**
 * Tries to convert a string in the format yyyy-MM-dd or dd/MM/yyyy into a Date object. Returns an
 * invalid date if the string is not in either format.
 */
export function parseDate(value: string | undefined): Date {
  if (value) {
    const isoDateMatch = ISO_DATE_REGEX.test(value);
    if (isoDateMatch) {
      return new Date(value);
    } else {
      const [day, month, year] = value.split('/').map(Number);
      if (day && month && year) {
        // reminder: month is 0-based in the Date constructor
        return new Date(year, month - 1, day);
      }
    }
  }
  return new Date(Number.NaN);
}

/**
 * Converts an ISO-8601 UTC date-time string into UK local time
 * (Europe/London), preserving milliseconds in output.
 *
 * Returns the original value when parsing fails.
 */
export function toUkDateTimeString(value: string, format = 'DD/MM/YYYY HH:mm:ss.SSS'): string {
  const parsedUtc = moment.utc(value, moment.ISO_8601, true);
  return parsedUtc.isValid() ? parsedUtc.tz(UK_TIME_ZONE).format(format) : value;
}
