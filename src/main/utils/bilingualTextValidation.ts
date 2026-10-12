export type BilingualTextValidationMessages = {
  englishInvalidCharacters: string;
  englishMaximumLength: string;
  englishRequired: string;
  welshInvalidCharacters: string;
  welshMaximumLength: string;
  welshRequired: string;
};

export type BilingualTextValidationConfig = {
  englishKey: string;
  englishPattern: RegExp;
  maximumLength: number;
  messages: BilingualTextValidationMessages;
  validatePatternWhenTooLong?: boolean;
  welshKey: string;
  welshPattern: RegExp;
};

export function validateBilingualTextPair(
  englishValue: string | undefined,
  welshValue: string | undefined,
  config: BilingualTextValidationConfig
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (englishValue && !welshValue) {
    errors[config.welshKey] = config.messages.welshRequired;
  }
  if (welshValue && !englishValue) {
    errors[config.englishKey] = config.messages.englishRequired;
  }

  validateValue(
    errors,
    config.englishKey,
    englishValue,
    config.englishPattern,
    config.maximumLength,
    {
      invalidCharacters: config.messages.englishInvalidCharacters,
      maximumLength: config.messages.englishMaximumLength,
    },
    config.validatePatternWhenTooLong
  );
  validateValue(
    errors,
    config.welshKey,
    welshValue,
    config.welshPattern,
    config.maximumLength,
    {
      invalidCharacters: config.messages.welshInvalidCharacters,
      maximumLength: config.messages.welshMaximumLength,
    },
    config.validatePatternWhenTooLong
  );

  return errors;
}

function validateValue(
  errors: Record<string, string>,
  key: string,
  value: string | undefined,
  pattern: RegExp,
  maximumLength: number,
  messages: { invalidCharacters: string; maximumLength: string },
  validatePatternWhenTooLong = true
): void {
  const tooLong = Boolean(value && value.length > maximumLength);
  if (tooLong) {
    errors[key] = messages.maximumLength;
  }
  if (value && (!tooLong || validatePatternWhenTooLong) && !pattern.test(value)) {
    errors[key] = messages.invalidCharacters;
  }
}
