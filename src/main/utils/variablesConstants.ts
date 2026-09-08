// Audit service
export const DEFAULT_PAGE_NUMBER = 0;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_PARAM = 1000;
export const CSV_PAGE_SIZE = 1000;
export const MAX_CSV_PAGES = 1;
export const EMAIL_PARTIAL_REGEX = /^[a-z0-9._+-]*(?:@[a-z0-9._+-]*)?$/i;

// Download CSV file service
export const CSV_HEADERS = [
  'Name',
  'Open/Closed',
  'Updated date',
  'Addresses',
  'Areas of law',
  'Type',
  'Crown court code',
  'County court code',
  'Magistrates court code',
  'Facilities',
  'Url',
  'Emails',
  'Contacts',
  'DX',
  'Opening times',
] as const;
export const PUBLIC_FRONTEND_URL = process.env.PUBLIC_FRONTEND_URL || 'https://localhost:3344';
export const ADDRESS_TYPE_LABELS = {
  VISIT_OR_CONTACT_US: 'Visit or contact us',
  VISIT_US: 'Visit us',
  WRITE_TO_US: 'Write to us',
} as const;
export const COURT_TYPE_CODE_LABELS = [
  ['magistrateCourtCode', "Magistrates' Court"],
  ['familyCourtCode', 'Family Court'],
  ['tribunalCode', 'Tribunal'],
  ['countyCourtCode', 'County Court'],
  ['crownCourtCode', 'Crown Court'],
] as const;
export const FACILITY_LABELS = {
  parking: 'Parking',
  babyChanging: 'Baby changing',
  cafeteria: 'Cafeteria',
  drinkVendingMachines: 'Drink vending machines',
  freeWaterDispensers: 'Free water dispensers',
  quietRoom: 'Quiet room',
  snackVendingMachines: 'Snack vending machines',
  waitingArea: 'Waiting area',
  waitingAreaChildren: 'Children waiting area',
  wifi: 'WiFi',
} as const;

// Home page filters service
export const DEFAULT_SORT_ORDER = 'asc';
export const PARTIAL_COURT_NAME_REGEX = /^[A-Za-z&'()\- ]*$/;
export const PARTIAL_COURT_NAME_ERROR =
  'Court or tribunal name must only include letters, spaces, brackets, apostrophes, hyphens and ampersands.';
export const VALID_SORT_BY_VALUES = ['lastUpdated', 'name'] as const;
export const VALID_SORT_ORDER_VALUES = ['asc', 'desc'] as const;

// Home page view service
export const HOME_PAGE_TITLE = 'Courts, tribunals and service centres';
export const DEFAULT_RESULTS_MESSAGE = 'No courts, tribunals or service centres found.';
export const SORT_ICON_PATHS = {
  ascending: '<path d="M6.5625 15.5L11 6.63125L15.4375 15.5H6.5625Z" fill="currentColor"/>',
  descending: '<path d="M15.4375 7L11 15.8687L6.5625 7L15.4375 7Z" fill="currentColor"/>',
  none: '<path d="M8.1875 9.5L10.9609 3.95703L13.7344 9.5H8.1875Z" fill="currentColor"/><path d="M13.7344 12.0781L10.9609 17.6211L8.1875 12.0781H13.7344Z" fill="currentColor"/>',
} as const;

// Users page filters service
export const SEARCH_MAX_LENGTH = 250;
export const SEARCH_REGEX = /^[A-Za-z0-9._+\-@]*$/;
export const VALID_SORT_BY_LAST_LOGIN_VALUES = ['lastLogin'] as const;

// Users page view service
export const UK_TIME_ZONE = 'Europe/London';

// Add court service
export const VALID_COURT_NAME_REGEX = /^[A-Z&'()\- ]+$/i;

// Court counter service opening hours service
export const EMAIL_REGEX =
  /^[A-Za-z0-9_+~-]+(?:\.[A-Za-z0-9_+~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

// Court contact details service
export const PHONE_NUMBER_REGEX = /^(?:\+44)?[0-9 ()-]{10,20}$/;
export const ENGLISH_TEXT_REGEX = /^[A-Za-z0-9 .,!?:;'"()\-/&@+]+$/;
export const WELSH_TEXT_REGEX = /^[\p{L}\p{M}0-9 .,!?:;'"()\-/&@+]+$/u;
export const MAX_EXPLANATION_LENGTH = 250;

// Court opening hours service
export const ALLOWED_OPENING_HOUR_TYPES = [
  'Bailiff office open',
  'County Court open',
  'Court open',
  'Crown Court open',
  'Family Court open',
  "Magistrates' Court open",
  'Telephone enquiries answered',
  'Telephone payments accepted',
  'Tribunal open',
] as const;
export type OpeningHourDay = {
  idPrefix: string;
  name: string;
  value: string;
};
export const OPENING_HOUR_DAYS: readonly OpeningHourDay[] = [
  { idPrefix: 'monday', name: 'Monday', value: 'MONDAY' },
  { idPrefix: 'tuesday', name: 'Tuesday', value: 'TUESDAY' },
  { idPrefix: 'wednesday', name: 'Wednesday', value: 'WEDNESDAY' },
  { idPrefix: 'thursday', name: 'Thursday', value: 'THURSDAY' },
  { idPrefix: 'friday', name: 'Friday', value: 'FRIDAY' },
];

// Court professional information service
export const MAX_REPEATABLE_ENTRIES = 5;
export const INTEGER_REGEX = /^\d+$/;
export const DX_CODE_MAX_LENGTH = 200;
export const REPEATABLE_DESCRIPTION_MAX_LENGTH = 250;
export const FAX_NUMBER_VALIDATION_ERROR =
  'Enter a fax number in the correct format, for example 01273 800 900 or 020 7450 4000';
export const GBS_VALIDATION_ERROR =
  'GBS code must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses';
export const INTERVIEW_ROOM_COUNT_ERROR = 'Enter a number of interview rooms between 1 and 150, or select No';
export const DX_VALIDATION_ERROR =
  'Must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses';

// Court single point of entry service
export const SUPPORTED_SINGLE_POINT_OF_ENTRY_SERVICES = [
  {
    areaOfLawName: 'Children',
    label: 'Childcare arrangements',
  },
] as const;
