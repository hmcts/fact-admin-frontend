const VALID_POSTCODE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]? ?\d[A-Z]{2}$/i;

const JURISDICTION_ERROR_REGEXES = {
  northernIrelandPostcode: /^(BT)/i,
  guernseyPostcode: /^(GY)/i,
  jerseyPostcode: /^(JE)/i,
  isleOfManPostcode: /^(IM)/i,
};

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
  return typeof value === 'string' ? value : '';
}

/**
 * Parses an optional string-like value.
 */
export function parseOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Checks whether a value is a UUID in the format expected by the API.
 */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// TODO: move this to a service

/**
 * Checks whether a value is a valid and acceptable postcode
 */
export const isValidPostcode = (value: string): boolean => checkPostcode(value) === undefined;

/**
 * Checks the postcode and returns an appropriate error type if there are any issues with the postcode.
 * If there are no issues, returns null.
 * @param postcode
 */
export const checkPostcode = (postcode: string): string | undefined => {
  // might be missing
  if (!postcode) {
    return 'blankPostcode';
  }

  // might be structurally invalid
  const trimmedPostcode = postcode.trim();
  if (trimmedPostcode.length === 0) {
    return 'blankPostcode';
  } else if (!VALID_POSTCODE_REGEX.test(trimmedPostcode)) {
    return 'invalidPostcode';
  }

  // might be in an unhandled jurisdiction
  for (const [key, regex] of Object.entries(JURISDICTION_ERROR_REGEXES)) {
    if (regex.test(trimmedPostcode)) {
      return key;
    }
  }

  // no obvious issues with the postcode
  return undefined;
};

