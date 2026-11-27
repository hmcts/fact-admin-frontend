// Audit service
export const EMAIL_PARTIAL_REGEX = /^[a-z0-9._+-]*(?:@[a-z0-9._+-]*)?$/i;

// Users page filters service
export const SEARCH_REGEX = /^[A-Za-z0-9._+\-@]*$/;

//Court address service
export const VALID_EPIM_ID_REGEX = /^[A-Z0-9 -]+$/i;

// Court counter service opening hours service
export const EMAIL_REGEX =
  /^[A-Za-z0-9_+~-]+(?:\.[A-Za-z0-9_+~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

// Court contact details service
export const PHONE_NUMBER_REGEX = /^(?:\+44)?[0-9 ()-]{10,20}$/;
export const ENGLISH_TEXT_REGEX = /^[A-Za-z0-9 .,'\-()&]+$/;
export const WELSH_TEXT_REGEX = /^[\p{L}\p{M}0-9 .,'\-()&]+$/u;

// Court professional information service
export const INTEGER_REGEX = /^\d+$/;
export const GBS_CODE_REGEX = /^[A-Za-z0-9]*$/;

// Favourite controller
export const COURT_NAME_PATTERN = /^[A-Za-z&'()\- ]*$/;

// Address validation
export const VALID_POSTCODE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
export const JURISDICTION_ERROR_REGEXES = {
  northernIrelandPostcode: /^(BT)/i,
  guernseyPostcode: /^(GY)/i,
  jerseyPostcode: /^(JE)/i,
  isleOfManPostcode: /^(IM)/i,
};

// Value parsers
export const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
