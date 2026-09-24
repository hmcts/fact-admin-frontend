import {
  COURT_NAME_ALLOWED_CHARACTERS_ERROR,
  COURT_NAME_LENGTH_ERROR,
  COURT_NAME_MESSAGE,
  SERVICE_CENTRE_NAME_ALLOWED_CHARACTERS_ERROR,
  SERVICE_CENTRE_NAME_LENGTH_ERROR,
  SERVICE_CENTRE_NAME_MAX_LENGTH,
  SERVICE_CENTRE_NAME_MESSAGE,
  SERVICE_CENTRE_NAME_MIN_LENGTH,
} from './constants/messageConstants';
import { VALID_COURT_NAME_REGEX, VALID_SERVICE_CENTRE_NAME_REGEX } from './constants/regexConstants';

export const getCourtNameValidationErrors = (name?: string): string[] => {
  const trimmedName = name?.trim();
  const nameErrors: string[] = [];

  if (!trimmedName || trimmedName.length === 0) {
    nameErrors.push(COURT_NAME_MESSAGE);
  } else if (trimmedName.length < 5 || trimmedName.length > 200) {
    nameErrors.push(COURT_NAME_LENGTH_ERROR);
  }

  if (trimmedName && !VALID_COURT_NAME_REGEX.test(trimmedName)) {
    nameErrors.push(COURT_NAME_ALLOWED_CHARACTERS_ERROR);
  }

  return nameErrors;
};

export const getServiceCentreNameValidationErrors = (name?: string): string[] => {
  const trimmedName = name?.trim();
  const nameErrors: string[] = [];

  if (!trimmedName || trimmedName.length === 0) {
    nameErrors.push(SERVICE_CENTRE_NAME_MESSAGE);
  } else if (
    trimmedName.length < SERVICE_CENTRE_NAME_MIN_LENGTH ||
    trimmedName.length > SERVICE_CENTRE_NAME_MAX_LENGTH
  ) {
    nameErrors.push(SERVICE_CENTRE_NAME_LENGTH_ERROR);
  }

  if (trimmedName && !VALID_SERVICE_CENTRE_NAME_REGEX.test(trimmedName)) {
    nameErrors.push(SERVICE_CENTRE_NAME_ALLOWED_CHARACTERS_ERROR);
  }

  return nameErrors;
};
