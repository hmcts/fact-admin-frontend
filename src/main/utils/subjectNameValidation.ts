import {
  COURT_NAME_ALLOWED_CHARACTERS_ERROR,
  COURT_NAME_LENGTH_ERROR,
  COURT_NAME_MAX_LENGTH,
  COURT_NAME_MESSAGE,
  COURT_NAME_MIN_LENGTH,
  SERVICE_CENTRE_NAME_ALLOWED_CHARACTERS_ERROR,
  SERVICE_CENTRE_NAME_LENGTH_ERROR,
  SERVICE_CENTRE_NAME_MAX_LENGTH,
  SERVICE_CENTRE_NAME_MESSAGE,
  SERVICE_CENTRE_NAME_MIN_LENGTH,
} from './constants/messageConstants';
import { VALID_COURT_NAME_REGEX, VALID_SERVICE_CENTRE_NAME_REGEX } from './constants/regexConstants';

type SubjectNameValidationConfig = {
  allowedCharactersError: string;
  lengthError: string;
  maximumLength: number;
  minimumLength: number;
  requiredError: string;
  validPattern: RegExp;
};

const getSubjectNameValidationErrors = (name: string | undefined, config: SubjectNameValidationConfig): string[] => {
  const trimmedName = name?.trim();
  const nameErrors: string[] = [];

  if (!trimmedName || trimmedName.length === 0) {
    nameErrors.push(config.requiredError);
  } else if (trimmedName.length < config.minimumLength || trimmedName.length > config.maximumLength) {
    nameErrors.push(config.lengthError);
  }

  if (trimmedName && !config.validPattern.test(trimmedName)) {
    nameErrors.push(config.allowedCharactersError);
  }

  return nameErrors;
};

export const getCourtNameValidationErrors = (name?: string): string[] =>
  getSubjectNameValidationErrors(name, {
    allowedCharactersError: COURT_NAME_ALLOWED_CHARACTERS_ERROR,
    lengthError: COURT_NAME_LENGTH_ERROR,
    maximumLength: COURT_NAME_MAX_LENGTH,
    minimumLength: COURT_NAME_MIN_LENGTH,
    requiredError: COURT_NAME_MESSAGE,
    validPattern: VALID_COURT_NAME_REGEX,
  });

export const getServiceCentreNameValidationErrors = (name?: string): string[] =>
  getSubjectNameValidationErrors(name, {
    allowedCharactersError: SERVICE_CENTRE_NAME_ALLOWED_CHARACTERS_ERROR,
    lengthError: SERVICE_CENTRE_NAME_LENGTH_ERROR,
    maximumLength: SERVICE_CENTRE_NAME_MAX_LENGTH,
    minimumLength: SERVICE_CENTRE_NAME_MIN_LENGTH,
    requiredError: SERVICE_CENTRE_NAME_MESSAGE,
    validPattern: VALID_SERVICE_CENTRE_NAME_REGEX,
  });
