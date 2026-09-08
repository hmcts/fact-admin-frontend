// ----------------------------------------------------------------------------
// Address & Postcode Validation

import {
  JURISDICTION_ERROR_REGEXES,
  POSTCODE_ERROR_MESSAGES,
  VALID_ADDRESS_LINE_REGEX,
  VALID_POSTCODE_REGEX,
} from './variablesConstants';

export const isValidPostcode = (value: string): boolean => {
  return validatePostcodeField(value) === undefined;
};

export const validatePostcodeField = (postcode: string | undefined): string | undefined => {
  if (!postcode) {
    return POSTCODE_ERROR_MESSAGES.blankPostcode;
  }

  const trimmedPostcode = postcode.trim();
  if (trimmedPostcode.length === 0) {
    return POSTCODE_ERROR_MESSAGES.blankPostcode;
  }

  if (!VALID_POSTCODE_REGEX.test(trimmedPostcode)) {
    return POSTCODE_ERROR_MESSAGES.invalidPostcode;
  }

  for (const [key, regex] of Object.entries(JURISDICTION_ERROR_REGEXES)) {
    if (regex.test(trimmedPostcode)) {
      return POSTCODE_ERROR_MESSAGES[key];
    }
  }

  return undefined;
};

export const validateAddressLine1Field = (value: string | undefined): string[] => {
  const errors: string[] = [];

  if (!value || value.trim().length === 0) {
    errors.push('Enter address line 1, typically the building and street');
  } else if (value.length > 255) {
    errors.push('Address line 1 must be 255 characters or less');
  }

  if (value && !VALID_ADDRESS_LINE_REGEX.test(value.trim())) {
    errors.push('Address line 1 must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses');
  }

  return errors;
};

export const validateAddressLine2Field = (value: string | undefined): string[] => {
  const errors: string[] = [];

  if (value && value.length > 255) {
    errors.push('Address line 2 must be 255 characters or less');
  }

  if (value && !VALID_ADDRESS_LINE_REGEX.test(value.trim())) {
    errors.push('Address line 2 must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses');
  }

  return errors;
};

export const validateTownCityField = (value: string | undefined): string[] => {
  const errors: string[] = [];

  if (!value || value.trim().length === 0) {
    errors.push('Enter a town or city');
  } else if (value.length > 100) {
    errors.push('Town or city must be 100 characters or less');
  }

  if (value && !VALID_ADDRESS_LINE_REGEX.test(value.trim())) {
    errors.push('Town or city must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses');
  }

  return errors;
};

export const validateCountyField = (value: string | undefined): string[] => {
  const errors: string[] = [];

  if (value && value.length > 100) {
    errors.push('County must be 100 characters or less');
  }

  if (value && !VALID_ADDRESS_LINE_REGEX.test(value.trim())) {
    errors.push('County must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses');
  }

  return errors;
};
