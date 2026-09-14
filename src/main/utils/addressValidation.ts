// ----------------------------------------------------------------------------
// Address & Postcode Validation

import {
  ADDRESS_LINE_1_INVALID_CHARACTERS_MESSAGE,
  ADDRESS_LINE_1_MAX_LENGTH_MESSAGE,
  ADDRESS_LINE_1_REQUIRED_MESSAGE,
  ADDRESS_LINE_2_INVALID_CHARACTERS_MESSAGE,
  ADDRESS_LINE_2_MAX_LENGTH_MESSAGE,
  ADDRESS_LINE_MAX_LENGTH,
  COUNTY_INVALID_CHARACTERS_MESSAGE,
  COUNTY_MAX_LENGTH,
  COUNTY_MAX_LENGTH_MESSAGE,
  JURISDICTION_ERROR_REGEXES,
  POSTCODE_ERROR_MESSAGES,
  TOWN_CITY_INVALID_CHARACTERS_MESSAGE,
  TOWN_CITY_MAX_LENGTH,
  TOWN_CITY_MAX_LENGTH_MESSAGE,
  TOWN_CITY_REQUIRED_MESSAGE,
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
    errors.push(ADDRESS_LINE_1_REQUIRED_MESSAGE);
  } else if (value.length > ADDRESS_LINE_MAX_LENGTH) {
    errors.push(ADDRESS_LINE_1_MAX_LENGTH_MESSAGE);
  }

  if (value && !VALID_ADDRESS_LINE_REGEX.test(value.trim())) {
    errors.push(ADDRESS_LINE_1_INVALID_CHARACTERS_MESSAGE);
  }

  return errors;
};

export const validateAddressLine2Field = (value: string | undefined): string[] => {
  const errors: string[] = [];

  if (value && value.length > ADDRESS_LINE_MAX_LENGTH) {
    errors.push(ADDRESS_LINE_2_MAX_LENGTH_MESSAGE);
  }

  if (value && !VALID_ADDRESS_LINE_REGEX.test(value.trim())) {
    errors.push(ADDRESS_LINE_2_INVALID_CHARACTERS_MESSAGE);
  }

  return errors;
};

export const validateTownCityField = (value: string | undefined): string[] => {
  const errors: string[] = [];

  if (!value || value.trim().length === 0) {
    errors.push(TOWN_CITY_REQUIRED_MESSAGE);
  } else if (value.length > TOWN_CITY_MAX_LENGTH) {
    errors.push(TOWN_CITY_MAX_LENGTH_MESSAGE);
  }

  if (value && !VALID_ADDRESS_LINE_REGEX.test(value.trim())) {
    errors.push(TOWN_CITY_INVALID_CHARACTERS_MESSAGE);
  }

  return errors;
};

export const validateCountyField = (value: string | undefined): string[] => {
  const errors: string[] = [];

  if (value && value.length > COUNTY_MAX_LENGTH) {
    errors.push(COUNTY_MAX_LENGTH_MESSAGE);
  }

  if (value && !VALID_ADDRESS_LINE_REGEX.test(value.trim())) {
    errors.push(COUNTY_INVALID_CHARACTERS_MESSAGE);
  }

  return errors;
};
