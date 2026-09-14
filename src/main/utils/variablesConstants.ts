import { z } from 'zod';

// Approval service
export const APPROVAL_DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss';

// Audit filter categories service
export const INCLUDED_AUDIT_FILTER_CATEGORIES = new Set([
  'email',
  'subjectType',
  'courtId',
  'serviceCentreId',
  'fromDate',
  'toDate',
]);
export const AUDIT_FILTER_CATEGORY_LABELS: Record<string, string> = {
  email: 'Email address',
  subjectType: 'Subject',
  courtId: 'Subject',
  serviceCentreId: 'Subject',
  fromDate: 'Between',
  toDate: 'Between',
};
export const AUDIT_FILTER_ITEM_LABELS: Record<string, string> = {
  email: 'Email address',
  subjectType: 'Type',
  courtId: 'Court Name',
  serviceCentreId: 'Service Centre Name',
  fromDate: 'From date',
  toDate: 'To date',
};

// Audit service
export const DEFAULT_PAGE_NUMBER = 0;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_PARAM = 1000;
export const CSV_PAGE_SIZE = 1000;
export const MAX_CSV_PAGES = 1;
export const EMAIL_PARTIAL_REGEX = /^[a-z0-9._+-]*(?:@[a-z0-9._+-]*)?$/i;
export const PAGE_NUMBER_MIN = 0;
export const PAGE_NUMBER_MAX = 100000;
export const PAGE_NUMBER_RANGE_ERROR = `Page number must be between ${PAGE_NUMBER_MIN} and ${PAGE_NUMBER_MAX}`;
export const PAGE_SIZE_MIN = 1;
export const PAGE_SIZE_RANGE_ERROR = `Page size must be between ${PAGE_SIZE_MIN} and ${MAX_PAGE_PARAM}`;
export const EMAIL_PARTIAL_REGEX_ERROR =
  "Email match may only contain letters, hyphens, periods, plus/minus signs, underscores, and a single 'at' (@) symbol";
export const FROM_DATE_INVALID_MESSAGE = 'From date must be a valid date';
export const FROM_DATE_IN_FUTURE_MESSAGE = 'From date must not be in the future';
export const FROM_DATE_AFTER_TO_DATE_MESSAGE = 'From date must not be after To date';
export const TO_DATE_BEFORE_FROM_DATE_MESSAGE = 'To date must not be before From date';

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
export const HOME_PAGE_INCLUDE_CLOSED_BOOLEAN_ERROR = 'includeClosed must be true or false';
export const HOME_PAGE_ONLY_SERVICE_CENTRES_BOOLEAN_ERROR = 'onlyServiceCentres must be true or false';
export const PAGE_SIZE_MIN_ERROR = 'pageSize must be greater than 0';
export const PAGE_SIZE_MAX_ERROR = `pageSize must be less than or equal to ${MAX_PAGE_PARAM}`;
export const PAGE_NUMBER_MIN_ERROR = 'pageNumber must be greater than or equal to 0';
export const PAGE_NUMBER_MAX_ERROR = `pageNumber must be less than or equal to ${MAX_PAGE_PARAM}`;
export const HOME_PAGE_FAVOURITES_PAGE_NUMBER_MIN_ERROR = 'favouritesPageNumber must be greater than or equal to 0';
export const HOME_PAGE_FAVOURITES_PAGE_NUMBER_MAX_ERROR =
  `favouritesPageNumber must be less than or equal to ${MAX_PAGE_PARAM}`;
export const SORT_ORDER_WITHOUT_SORT_BY_ERROR = 'sortOrder cannot be provided without sortBy';
export const HOME_PAGE_REGION_UUID_ERROR = 'Region must be a valid UUID';
export const HOME_PAGE_REGION_INVALID_ERROR = 'Region must be a valid region';
export const HOME_PAGE_FAVOURITE_STATUS_ERROR_MESSAGE = 'There was a problem loading favourite status.';
export const HOME_PAGE_FAVOURITES_ERROR_MESSAGE = 'There was a problem loading favourites.';
export const HOME_PAGE_REGIONS_AND_COURTS_LOAD_ERROR_MESSAGE =
  'There was a problem loading regions and courts, tribunals and service centres.';
export const HOME_PAGE_REGIONS_LOAD_ERROR_MESSAGE = 'There was a problem loading regions.';
export const HOME_PAGE_COURTS_LOAD_ERROR_MESSAGE = 'There was a problem loading courts, tribunals and service centres.';

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
export const USERS_PAGE_SEARCH_VALIDATION_ERROR =
  'Search must only include letters, numbers, @ symbols, dots, underscores, plus signs and hyphens.';

// Users page view service
export const UK_TIME_ZONE = 'Europe/London';

// Add court service
export const VALID_COURT_NAME_REGEX = /^[A-Z&'()\- ]+$/i;
export const COURT_NAME_MIN_LENGTH = 5;
export const COURT_NAME_MAX_LENGTH = 200;
export const COURT_NAME_LENGTH_ERROR = `Court name should be between ${COURT_NAME_MIN_LENGTH} and ${COURT_NAME_MAX_LENGTH} characters`;
export const VALID_COURT_NAME_REGEX_MESSAGE =
  'Court name must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses';
export const COURT_NAME_MESSAGE = 'Enter a name for the court';
export const COURT_REGION_MESSAGE = 'Select a region for the court';
export const COURT_OPEN_MESSAGE = 'Select whether the court is open or closed';
export const COURT_ALREADY_EXISTS_MESSAGE = 'A court with the entered name already exists';

//Court address service
export const VALID_EPIM_ID_REGEX = /^[A-Z0-9 -]+$/i;
export const COURT_ADDRESS_TYPE_REQUIRED_MESSAGE = 'Select an address type';
export const COURT_ADDRESS_AREAS_OF_LAW_COUNT_MESSAGE =
  'Please select between 1 and 5 areas of law that this address is relevant for';
export const COURT_ADDRESS_COURT_TYPES_REQUIRED_MESSAGE =
  'Please select at least one court type that this address is relevant for';
export const EPIM_ID_MAX_LENGTH_MESSAGE = 'ePIMS Ref ID must be 10 characters or less';
export const EPIM_ID_REGEX_MESSAGE = 'ePIMS Ref ID must only include letters a to z, spaces and dashes.';
export const COURT_ADDRESS_DELETE_REQUIRES_AT_LEAST_ONE_MESSAGE =
  'Unable to delete this address: At least one address is required for a court.';
export const COURT_ADDRESS_SINGLE_VISIT_ADDRESS_MESSAGE =
  'A court can only have one listed address for visiting and this court already has one.  Please edit the other visit address first.';

// Court building facilities service
export const COURT_BUILDING_FACILITIES_PARKING_REQUIRED_MESSAGE = 'Select whether the parking is available';
export const COURT_BUILDING_FACILITIES_WAITING_AREA_REQUIRED_MESSAGE = 'Select whether the waiting area is available';
export const COURT_BUILDING_FACILITIES_QUIET_ROOM_REQUIRED_MESSAGE = 'Select whether the quiet room is available';
export const COURT_BUILDING_FACILITIES_BABY_CHANGING_REQUIRED_MESSAGE = 'Select whether the baby changing is available';
export const COURT_BUILDING_FACILITIES_WIFI_REQUIRED_MESSAGE = 'Select whether the WiFi is available';
export const COURT_BUILDING_FACILITIES_WAITING_AREA_CHILDREN_REQUIRED_MESSAGE =
  'Select if a separate waiting area is available for children';

// Court cases heard Service
export const AREA_OF_LAW_VALIDATION_MESSAGE = 'Select at least one type of case heard at this court.';

// Court counter service opening hours service
export const EMAIL_REGEX =
  /^[A-Za-z0-9_+~-]+(?:\.[A-Za-z0-9_+~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
export const COUNTER_SERVICE_ASSISTANCE_REQUIRED_MESSAGE = 'Select what the counter can assist with';
export const COUNTER_SERVICE_APPOINTMENT_NEEDED_REQUIRED_MESSAGE = 'Select yes if an appointment is needed';
export const COUNTER_SERVICE_CONTACT_EMAIL_INVALID_MESSAGE = 'Enter a valid contact email address';
export const COUNTER_SERVICE_SAME_TIMES_SELECTION_REQUIRED_MESSAGE =
  'Select whether the counter opens and closes at the same time Monday to Friday';

// Court contact details service
export const PHONE_NUMBER_REGEX = /^(?:\+44)?[0-9 ()-]{10,20}$/;
export const ENGLISH_TEXT_REGEX = /^[A-Za-z0-9 .,!?:;'"()\-/&@+]+$/;
export const WELSH_TEXT_REGEX = /^[\p{L}\p{M}0-9 .,!?:;'"()\-/&@+]+$/u;
export const MAX_EXPLANATION_LENGTH = 250;
export const CONTACT_TYPE_REQUIRED_MESSAGE = 'Select a contact type';
export const CONTACT_METHOD_REQUIRED_MESSAGE = 'Select at least one contact method';
export const EMAIL_REQUIRED_MESSAGE = 'Enter an email address';
export const EMAIL_INVALID_MESSAGE = 'Enter an email address in the correct format';
export const PHONE_NUMBER_REQUIRED_MESSAGE = 'Enter a phone number';
export const PHONE_NUMBER_INVALID_MESSAGE = 'Enter a phone number in the correct format';
export const COURT_CONTACT_EXPLANATION_MAX_LENGTH_MESSAGE = 'Explanation must be 250 characters or fewer';
export const COURT_CONTACT_EXPLANATION_INVALID_CHARACTERS_MESSAGE =
  'Explanation must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs';
export const WELSH_TRANSLATION_REQUIRED_MESSAGE =
  'Because you provided an explanation in English, the Welsh translation is now mandatory';
export const ENGLISH_TRANSLATION_REQUIRED_MESSAGE =
  'Because you provided an explanation in Welsh, the English translation is now mandatory';
export const COURT_CONTACT_WELSH_TRANSLATION_MAX_LENGTH_MESSAGE = 'Welsh translation must be 250 characters or fewer';
export const COURT_CONTACT_WELSH_EXPLANATION_INVALID_CHARACTERS_MESSAGE =
  'Welsh Explanation must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs';

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
export const OPENING_HOUR_AT_LEAST_ONE_DAY_REQUIRED_MESSAGE = 'Select at least one day';
export const OPENING_HOUR_OPENING_AFTER_CLOSING_MESSAGE = 'The opening time cannot be after the closing time';
export const OPENING_HOUR_CLOSING_BEFORE_OPENING_MESSAGE = 'The closing time cannot be before the opening time';
export const OPENING_HOUR_OPENING_EQUALS_CLOSING_MESSAGE = 'The opening time cannot be the same as the closing time';
export const OPENING_HOUR_CLOSING_EQUALS_OPENING_MESSAGE = 'The closing time cannot be the same as the opening time';
export const OPENING_HOUR_TYPE_REQUIRED_MESSAGE = 'Select an opening hours type';
export const OPENING_HOUR_TYPE_ALREADY_EXISTS_MESSAGE =
  'A court can only have one opening hour per opening hour type. Please edit the other opening hour first.';
export const OPENING_HOUR_SAME_TIMES_SELECTION_REQUIRED_MESSAGE =
  'Select whether the court opens and closes at the same time Monday to Friday';

// Court professional information service
export const MAX_REPEATABLE_ENTRIES = 5;
export const INTEGER_REGEX = /^\d+$/;
export const DX_CODE_MAX_LENGTH = 200;
export const REPEATABLE_DESCRIPTION_MAX_LENGTH = 250;
export const INTERVIEW_ROOM_COUNT_REQUIRED_ERROR = 'Enter the number of interview rooms';
export const INTERVIEW_ROOM_COUNT_NUMBERS_ONLY_ERROR = 'Enter the number of interview rooms using numbers only';
export const FAX_NUMBER_VALIDATION_ERROR =
  'Enter a fax number in the correct format, for example 01273 800 900 or 020 7450 4000';
export const GBS_VALIDATION_ERROR =
  'GBS code must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses';
export const INTERVIEW_ROOM_COUNT_ERROR = 'Enter a number of interview rooms between 1 and 150, or select No';
export const DX_VALIDATION_ERROR =
  'Must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses';
export const DX_CODE_EXPLANATION_WITHOUT_CODE_MESSAGE =
  'You have entered a DX code explanation without a DX code, please add a code or remove the explanation';
export const DX_CODE_WELSH_EXPLANATION_WITHOUT_CODE_MESSAGE =
  'You have entered a DX code Welsh explanation without a DX code, please add a code or remove the Welsh explanation';
export const DX_CODE_WELSH_TRANSLATION_REQUIRED_MESSAGE =
  'Because you provided an explanation in English, the Welsh translation is now mandatory';
export const DX_CODE_ENGLISH_TRANSLATION_REQUIRED_MESSAGE =
  'Because you provided an explanation in Welsh, the English translation is now mandatory';
export const FAX_NUMBER_DESCRIPTION_WITHOUT_NUMBER_MESSAGE =
  'You have entered a description without a fax number, please add a number or remove the description';
export const FAX_NUMBER_WELSH_DESCRIPTION_WITHOUT_NUMBER_MESSAGE =
  'You have entered a Welsh description without a fax number, please add a number or remove the description';
export const FAX_NUMBER_WELSH_TRANSLATION_REQUIRED_MESSAGE =
  'Because you provided a description in English, the Welsh translation is now mandatory';
export const FAX_NUMBER_ENGLISH_TRANSLATION_REQUIRED_MESSAGE =
  'Because you provided a description in Welsh, the English translation is now mandatory';

// Court single point of entry service
export const SUPPORTED_SINGLE_POINT_OF_ENTRY_SERVICES = [
  {
    areaOfLawName: 'Children',
    label: 'Childcare arrangements',
  },
] as const;

// Court warning notice service
export const WARNING_NOTICE_MAX_LENGTH = 250;
export const WARNING_NOTICE_MAX_LENGTH_MESSAGE = `Warning notice must be ${WARNING_NOTICE_MAX_LENGTH} characters or less`;
export const WELSH_WARNING_NOTICE_MAX_LENGTH_MESSAGE = `Welsh warning notice must be ${WARNING_NOTICE_MAX_LENGTH} characters or less`;
export const WARNING_NOTICE_INVALID_CHARACTERS_MESSAGE =
  'Warning notice must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses';
export const WELSH_WARNING_NOTICE_INVALID_CHARACTERS_MESSAGE =
  'Welsh warning notice must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses';
export const ENGLISH_WARNING_NOTICE_REQUIRED_MESSAGE =
  'Because you provided a warning notice in Welsh, the English translation is now mandatory';
export const WELSH_WARNING_NOTICE_REQUIRED_MESSAGE =
  'Because you provided a warning notice in English, the Welsh translation is now mandatory';

// Add service centre service
export const VALID_SERVICE_CENTRE_NAME_REGEX = /^[A-Za-z0-9'()\- ]+$/;
export const SERVICE_CENTRE_NAME_MIN_LENGTH = 5;
export const SERVICE_CENTRE_NAME_MAX_LENGTH = 200;
export const SERVICE_CENTRE_NAME_MESSAGE = 'Enter a name for the service centre';
export const SERVICE_CENTRE_NAME_LENGTH_ERROR = `Service centre name should be between ${SERVICE_CENTRE_NAME_MIN_LENGTH} and ${SERVICE_CENTRE_NAME_MAX_LENGTH} characters`;
export const VALID_SERVICE_CENTRE_NAME_REGEX_MESSAGE =
  'Service centre name must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses';
export const SERVICE_CENTRE_REGION_MESSAGE = 'Select a region for the service centre';
export const SERVICE_CENTRE_SERVICE_AREA_MESSAGE = 'Please specify the service areas of the service centre';
export const SERVICE_CENTRE_OPEN_MESSAGE = 'Select whether the service centre is open or closed';

// Service centre address service
export const SERVICE_CENTRE_ADDRESS_OPTIONS_FETCH_ERROR_MESSAGE = 'Unable to fetch address options';
export const SERVICE_CENTRE_SINGLE_ADDRESS_ONLY_MESSAGE =
  'Only a single address can be added for a service centre, and this service centre already has an address assigned.';

// Service centre cases heard service
export const SERVICE_CENTRE_AREAS_OF_LAW_VALIDATION_MESSAGE =
  'Select at least one type of case heard at this service centre.';

// Service centre warning notice service
export const MAX_SERVICE_CENTRE_WARNING_NOTICE_LENGTH = 250;

// Audit controller
export const UI_DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss.SSS';

// Favourite controller
export const SAFE_ORIGIN = 'https://fact-admin.local';
export const SAFE_RETURN_KEYS = new Set([
  'favouritesPageNumber',
  'includeClosed',
  'onlyServiceCentres',
  'pageNumber',
  'pageSize',
  'partialCourtName',
  'regionId',
  'sortBy',
  'sortOrder',
  'tab',
]);
export const SAFE_RETURN_HASHES = new Set(['', '#courts', '#favourites']);
export const COURT_NAME_PATTERN = /^[A-Za-z&'()\- ]*$/;

// Schemas
export const SUBJECT_TYPE = z.enum(['COURT', 'SERVICE_CENTRE']);
export const ADDRESS_TYPE = z.enum(['VISIT_US', 'WRITE_TO_US', 'VISIT_OR_CONTACT_US']);
export const CATCHMENT_TYPE = z.enum(['LOCAL', 'NATIONAL', 'REGIONAL']);

// Court accessibility validation Config
export const TOILET_DESC_REGEX = /^[A-Za-z0-9 ()':,\-;.]+$/;
export const TOILET_DESC_REGEX_WELSH = /^[\p{L}0-9 ()':,\-;.]+$/u;
export const MIN_LIFT_DOOR_WIDTH_CM = 1;
export const MAX_LIFT_DOOR_WIDTH_CM = 1000;
export const MIN_LIFT_DOOR_LIMIT_KG = 1;
export const MAX_LIFT_DOOR_LIMIT_KG = 10000;

// Address validation
export const VALID_POSTCODE_REGEX = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
export const VALID_ADDRESS_LINE_REGEX = /^[A-Z0-9 ()':,.-]+$/i;
export const JURISDICTION_ERROR_REGEXES = {
  northernIrelandPostcode: /^(BT)/i,
  guernseyPostcode: /^(GY)/i,
  jerseyPostcode: /^(JE)/i,
  isleOfManPostcode: /^(IM)/i,
};
export const POSTCODE_ERROR_MESSAGES: Record<string, string> = {
  blankPostcode: 'Enter a postcode',
  invalidPostcode: 'Postcode format is invalid',
  northernIrelandPostcode: 'Northern Ireland postcodes are not supported for this service',
  guernseyPostcode: 'Guernsey postcodes are not supported for this service',
  jerseyPostcode: 'Jersey postcodes are not supported for this service',
  isleOfManPostcode: 'Isle of man postcodes are not supported for this service',
};

// Value parsers
export const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
