import {
  CONTACT_METHOD_REQUIRED_MESSAGE,
  EMAIL_INVALID_MESSAGE,
  EMAIL_REQUIRED_MESSAGE,
  PHONE_NUMBER_INVALID_MESSAGE,
  PHONE_NUMBER_REQUIRED_MESSAGE,
} from './variablesConstants';

export type ContactValidationError = {
  href: string;
  text: string;
};

export type ContactFormErrors = {
  contactEmail?: string;
  contactMethods?: string;
  contactTelephone?: string;
};

const emailPattern = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const phoneNumberPattern = /^(?:\+44)?[0-9 ]{10,20}$/;

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
    } else if (!emailPattern.test(contactEmail)) {
      formErrors.contactEmail = EMAIL_INVALID_MESSAGE;
      errorSummary.push({ href: '#contact-email', text: formErrors.contactEmail });
    }
  }

  if (selectedContactMethods.includes('phone')) {
    if (!contactTelephone) {
      formErrors.contactTelephone = PHONE_NUMBER_REQUIRED_MESSAGE;
      errorSummary.push({ href: '#contact-telephone', text: formErrors.contactTelephone });
    } else if (!phoneNumberPattern.test(contactTelephone)) {
      formErrors.contactTelephone = PHONE_NUMBER_INVALID_MESSAGE;
      errorSummary.push({ href: '#contact-telephone', text: formErrors.contactTelephone });
    }
  }
};
