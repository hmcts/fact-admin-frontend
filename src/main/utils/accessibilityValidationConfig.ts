// eslint-disable-next-line import/namespace
import type { FacilityModel } from '../services/AccessibilityService';

import { Rule, addError, patternRule, validateBooleanField } from './validation';

// Regex constants
export const UK_PHONE_REGEX = /^((\+44|)[0-9 ]{10,20})$/; // kept same regex in backend ideally it should be 10-12 digit though
export const TOILET_DESC_REGEX = /^[A-Za-z0-9 ()':,\-;.]+$/;

const isMissing = (value: number | null | undefined): boolean => value === undefined || value === null;
const isInvalidNumber = (value: number | null | undefined): boolean => typeof value === 'number' && Number.isNaN(value);

export const validate = (model: FacilityModel): Record<string, string[]> | undefined => {
  const errors: Record<string, string[]> = {};

  const rules: Rule[] = [
    // Boolean fields
    {
      key: 'accessibleParking',
      validate: m => validateBooleanField(m.accessibleParking, 'Select whether accessible parking is available'),
    },
    {
      key: 'accessibleEntrance',
      validate: m => validateBooleanField(m.accessibleEntrance, 'Select whether an accessible entrance is available'),
    },
    {
      key: 'lift',
      validate: m => validateBooleanField(m.lift, 'Select whether a lift is available'),
    },
    {
      key: 'quietRoom',
      validate: m => validateBooleanField(m.quietRoom, 'Select whether a quiet room is available'),
    },

    // Lift conditionals
    {
      key: 'liftDoorLimit',
      validate: m => (m.lift && isMissing(m.liftDoorLimit) ? ['Enter the lift door limit'] : undefined),
    },
    {
      key: 'liftDoorLimit',
      validate: m =>
        m.lift && isInvalidNumber(m.liftDoorLimit) ? ['Lift door limit must be a valid number'] : undefined,
    },
    {
      key: 'liftDoorWidth',
      validate: m => (m.lift && isMissing(m.liftDoorWidth) ? ['Enter the lift door width'] : undefined),
    },
    {
      key: 'liftDoorWidth',
      validate: m =>
        m.lift && isInvalidNumber(m.liftDoorWidth) ? ['Lift door width must be a valid number'] : undefined,
    },

    // Accessible entrance phone (required)
    {
      key: 'accessibleEntrancePhoneNumber',
      validate: m =>
        m.accessibleEntrance === false && !m.accessibleEntrancePhoneNumber?.trim()
          ? ['Enter a phone number for the accessible entrance']
          : undefined,
    },

    // Phone pattern
    patternRule(
      'accessibleParkingPhoneNumber',
      UK_PHONE_REGEX,
      'Enter a valid phone number (10-20 digits, optional +44, spaces allowed)'
    ),
    patternRule(
      'accessibleEntrancePhoneNumber',
      UK_PHONE_REGEX,
      'Enter a valid phone number (10-20 digits, optional +44, spaces allowed)'
    ),

    // Accessible toilet description (required)
    {
      key: 'accessibleToiletDescription',
      validate: m =>
        !m.accessibleToiletDescription?.trim()
          ? ['Enter a description of the accessible toilet facilities']
          : undefined,
    },

    // Toilet description pattern
    patternRule(
      'accessibleToiletDescription',
      TOILET_DESC_REGEX,
      'Enter a valid description (letters, numbers, spaces and basic punctuation only)'
    ),

    // Hearing equipment
    {
      key: 'hearingEnhancementEquipment',
      validate: m =>
        !m.hearingEnhancementEquipment ? ['Select what hearing enhancement equipment is available'] : undefined,
    },
  ];

  // Run all rules
  for (const rule of rules) {
    addError(errors, rule.key as string, rule.validate(model));
  }

  return Object.keys(errors).length ? errors : undefined;
};
