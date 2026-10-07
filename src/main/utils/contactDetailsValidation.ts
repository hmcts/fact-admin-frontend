import { toValidationErrorEntries } from './apiResponses';
import {
  CONTACT_METHOD_REQUIRED_MESSAGE,
  EMAIL_INVALID_MESSAGE,
  EMAIL_REQUIRED_MESSAGE,
  PHONE_NUMBER_INVALID_MESSAGE,
  PHONE_NUMBER_REQUIRED_MESSAGE,
} from './constants/messageConstants';
import { EMAIL_REGEX, PHONE_NUMBER_REGEX } from './constants/regexConstants';

export type ContactValidationError = {
  href: string;
  text: string;
};

export type ContactFormErrors = {
  contactEmail?: string;
  contactExplanation?: string;
  contactExplanationCy?: string;
  contactMethods?: string;
  contactTelephone?: string;
  contactType?: string;
};

export type ContactFormValues = {
  contactEmail: string;
  contactExplanation: string;
  contactExplanationCy: string;
  contactMethods: string[];
  contactTelephone: string;
};

export type ContactDescriptionTypeItem = {
  selected?: boolean;
  text: string;
  value: string;
};

export type ContactExplanationValidationConfig = {
  englishInvalidCharacters: string;
  englishRequired: string;
  englishTooLong: string;
  maximumLength: number;
  welshInvalidCharacters: string;
  welshRequired: string;
  welshTooLong: string;
  englishPattern: RegExp;
  welshPattern: RegExp;
};

export type ContactApiFieldMapping<TFormErrors> = {
  formField: keyof TFormErrors & string;
  href: string;
};

export const emptyContactFormValues = (): ContactFormValues => ({
  contactEmail: '',
  contactExplanation: '',
  contactExplanationCy: '',
  contactMethods: [],
  contactTelephone: '',
});

export const buildContactFormValues = (contactDetail: {
  email?: string | null;
  explanation?: string | null;
  explanationCy?: string | null;
  phoneNumber?: string | null;
}): ContactFormValues => ({
  contactEmail: contactDetail.email ?? '',
  contactExplanation: contactDetail.explanation ?? '',
  contactExplanationCy: contactDetail.explanationCy ?? '',
  contactMethods: [contactDetail.email ? 'email' : null, contactDetail.phoneNumber ? 'phone' : null].filter(
    (value): value is string => Boolean(value)
  ),
  contactTelephone: contactDetail.phoneNumber ?? '',
});

export const parseSelectedContactMethods = (value: unknown): string[] =>
  [value].flat().filter((method): method is string => typeof method === 'string' && method.length > 0);

export const buildContactDescriptionTypeItems = (
  types: { id: string; name: string }[],
  selectedId?: string
): ContactDescriptionTypeItem[] => [
  { text: 'Select', value: '' },
  ...types.map(type => ({ selected: selectedId === type.id, text: type.name, value: type.id })),
];

export const validateContactDetailsMethods = (
  selectedContactMethods: string[],
  contactEmail: string,
  contactTelephone: string,
  formErrors: ContactFormErrors,
  errorSummary: ContactValidationError[]
): void => {
  if (!selectedContactMethods.length) {
    formErrors.contactMethods = CONTACT_METHOD_REQUIRED_MESSAGE;
    errorSummary.push({ href: '#contact-methods', text: formErrors.contactMethods });
  }

  if (selectedContactMethods.includes('email')) {
    if (!contactEmail) {
      formErrors.contactEmail = EMAIL_REQUIRED_MESSAGE;
      errorSummary.push({ href: '#contact-email', text: formErrors.contactEmail });
    } else if (!EMAIL_REGEX.test(contactEmail)) {
      formErrors.contactEmail = EMAIL_INVALID_MESSAGE;
      errorSummary.push({ href: '#contact-email', text: formErrors.contactEmail });
    }
  }

  if (selectedContactMethods.includes('phone')) {
    if (!contactTelephone) {
      formErrors.contactTelephone = PHONE_NUMBER_REQUIRED_MESSAGE;
      errorSummary.push({ href: '#contact-telephone', text: formErrors.contactTelephone });
    } else if (!PHONE_NUMBER_REGEX.test(contactTelephone)) {
      formErrors.contactTelephone = PHONE_NUMBER_INVALID_MESSAGE;
      errorSummary.push({ href: '#contact-telephone', text: formErrors.contactTelephone });
    }
  }
};

export const validateContactExplanationFields = (
  formValues: ContactFormValues,
  formErrors: ContactFormErrors,
  errorSummary: ContactValidationError[],
  config: ContactExplanationValidationConfig
): void => {
  const { contactExplanation, contactExplanationCy } = formValues;

  if (contactExplanation) {
    if (contactExplanation.length > config.maximumLength) {
      formErrors.contactExplanation = config.englishTooLong;
    } else if (!config.englishPattern.test(contactExplanation)) {
      formErrors.contactExplanation = config.englishInvalidCharacters;
    }
    if (formErrors.contactExplanation) {
      errorSummary.push({ href: '#contact-explanation', text: formErrors.contactExplanation });
    }
    if (!contactExplanationCy) {
      formErrors.contactExplanationCy = config.welshRequired;
      errorSummary.push({ href: '#contact-explanation-cy', text: formErrors.contactExplanationCy });
    }
  }

  if (contactExplanationCy) {
    if (!contactExplanation) {
      formErrors.contactExplanation = config.englishRequired;
      errorSummary.push({ href: '#contact-explanation', text: formErrors.contactExplanation });
    }
    if (contactExplanationCy.length > config.maximumLength) {
      formErrors.contactExplanationCy = config.welshTooLong;
    } else if (!config.welshPattern.test(contactExplanationCy)) {
      formErrors.contactExplanationCy = config.welshInvalidCharacters;
    }
    if (formErrors.contactExplanationCy) {
      errorSummary.push({ href: '#contact-explanation-cy', text: formErrors.contactExplanationCy });
    }
  }
};

export const mapContactApiValidationErrors = <TFormErrors extends ContactFormErrors>(
  apiErrors: ReadonlyMap<string, string>,
  fieldMappings: Record<string, ContactApiFieldMapping<TFormErrors>>,
  options: {
    unknownErrorText?: (message: string) => string;
  } = {}
): { errorSummary: ContactValidationError[]; formErrors: TFormErrors } => {
  const formErrors = {} as TFormErrors;
  const errorSummary: ContactValidationError[] = [];

  for (const [field, message] of toValidationErrorEntries(apiErrors)) {
    const mapping = fieldMappings[field];
    if (!mapping) {
      errorSummary.push({ href: '#main-content', text: options.unknownErrorText?.(message) ?? message });
      continue;
    }
    (formErrors as Record<string, string | undefined>)[mapping.formField] = message;
    errorSummary.push({ href: mapping.href, text: message });
  }

  return { errorSummary, formErrors };
};
