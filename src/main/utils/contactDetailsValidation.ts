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
    formErrors.contactMethods = 'Select at least one contact method';
    errorSummary.push({ href: '#contact-methods', text: formErrors.contactMethods });
  }

  if (selectedContactMethods.includes('email')) {
    if (!contactEmail) {
      formErrors.contactEmail = 'Enter an email address';
      errorSummary.push({ href: '#contact-email', text: formErrors.contactEmail });
    } else if (!emailPattern.test(contactEmail)) {
      formErrors.contactEmail = 'Enter an email address in the correct format';
      errorSummary.push({ href: '#contact-email', text: formErrors.contactEmail });
    }
  }

  if (selectedContactMethods.includes('phone')) {
    if (!contactTelephone) {
      formErrors.contactTelephone = 'Enter a phone number';
      errorSummary.push({ href: '#contact-telephone', text: formErrors.contactTelephone });
    } else if (!phoneNumberPattern.test(contactTelephone)) {
      formErrors.contactTelephone = 'Enter a phone number in the correct format';
      errorSummary.push({ href: '#contact-telephone', text: formErrors.contactTelephone });
    }
  }
};
