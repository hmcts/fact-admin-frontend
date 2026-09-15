import { describe, expect, test } from '@jest/globals';

import {
  ContactFormErrors,
  ContactValidationError,
  validateContactDetailsMethods,
} from '../../../main/utils/contactDetailsValidation';

describe('contactDetailsValidation', () => {
  test('adds error when no contact method is selected', () => {
    const formErrors: ContactFormErrors = {};
    const errorSummary: ContactValidationError[] = [];

    validateContactDetailsMethods([], '', '', formErrors, errorSummary);

    expect(formErrors.contactMethods).toBe('Select at least one contact method');
    expect(errorSummary).toContainEqual({ href: '#contact-methods', text: 'Select at least one contact method' });
  });

  test('validates required and invalid email formats when email is selected', () => {
    const missingEmailErrors: ContactFormErrors = {};
    const missingEmailSummary: ContactValidationError[] = [];
    validateContactDetailsMethods(['email'], '', '', missingEmailErrors, missingEmailSummary);

    expect(missingEmailErrors.contactEmail).toBe('Enter an email address');
    expect(missingEmailSummary).toContainEqual({ href: '#contact-email', text: 'Enter an email address' });

    const invalidEmailErrors: ContactFormErrors = {};
    const invalidEmailSummary: ContactValidationError[] = [];
    validateContactDetailsMethods(['email'], 'invalid-email', '', invalidEmailErrors, invalidEmailSummary);

    expect(invalidEmailErrors.contactEmail).toBe('Enter an email address in the correct format');
    expect(invalidEmailSummary).toContainEqual({
      href: '#contact-email',
      text: 'Enter an email address in the correct format',
    });
  });

  test('validates required and invalid phone formats when phone is selected', () => {
    const missingPhoneErrors: ContactFormErrors = {};
    const missingPhoneSummary: ContactValidationError[] = [];
    validateContactDetailsMethods(['phone'], '', '', missingPhoneErrors, missingPhoneSummary);

    expect(missingPhoneErrors.contactTelephone).toBe('Enter a phone number');
    expect(missingPhoneSummary).toContainEqual({ href: '#contact-telephone', text: 'Enter a phone number' });

    const invalidPhoneErrors: ContactFormErrors = {};
    const invalidPhoneSummary: ContactValidationError[] = [];
    validateContactDetailsMethods(['phone'], '', 'not-a-phone', invalidPhoneErrors, invalidPhoneSummary);

    expect(invalidPhoneErrors.contactTelephone).toBe('Enter a phone number in the correct format');
    expect(invalidPhoneSummary).toContainEqual({
      href: '#contact-telephone',
      text: 'Enter a phone number in the correct format',
    });
  });
});
