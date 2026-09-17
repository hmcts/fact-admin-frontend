export const VALID_COURT_NAME_REGEX = /^(?=.*[A-Z])[A-Z&'()\- ]+$/i;

export const COURT_NAME_ALLOWED_CHARACTERS_ERROR =
  'Court name must include at least one letter and only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses';

export const getCourtNameValidationErrors = (name?: string): string[] => {
  const trimmedName = name?.trim();
  const nameErrors: string[] = [];

  if (!trimmedName || trimmedName.length === 0) {
    nameErrors.push('Enter a name for the court');
  } else if (trimmedName.length < 5 || trimmedName.length > 200) {
    nameErrors.push('Court name should be between 5 and 200 characters');
  }

  if (trimmedName && !VALID_COURT_NAME_REGEX.test(trimmedName)) {
    nameErrors.push(COURT_NAME_ALLOWED_CHARACTERS_ERROR);
  }

  return nameErrors;
};

