// eslint-disable-next-line import/namespace
import type { AccessibilityModel } from '../services/AccessibilityService';

import { Rule, addError, patternRule, validateBooleanField } from './validation';

// Regex constants
export const UK_PHONE_REGEX = /^((\+44|)[0-9 ]{10,20})$/; // kept same regex in backend ideally it should be 10-12 digit though
export const TOILET_DESC_REGEX = /^[A-Za-z0-9 ()':,\-;.]+$/;

const MIN_LIFT_DOOR_WIDTH_CM = 1;
const MAX_LIFT_DOOR_WIDTH_CM = 1000;
const MIN_LIFT_DOOR_LIMIT_KG = 1;
const MAX_LIFT_DOOR_LIMIT_KG = 10000;

const isMissing = (value: number | null | undefined): boolean => value === undefined || value === null;
const isInvalidNumber = (value: number | null | undefined): boolean => typeof value === 'number' && Number.isNaN(value);
const isBelowMin = (value: number | null | undefined, min: number): boolean =>
  typeof value === 'number' && !Number.isNaN(value) && value < min;
const isAboveMax = (value: number | null | undefined, max: number): boolean =>
  typeof value === 'number' && !Number.isNaN(value) && value > max;

export const validate = (model: AccessibilityModel): Record<string, string[]> | undefined => {
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
      key: 'liftDoorWidth',
      validate: m => (m.lift && isMissing(m.liftDoorWidth) ? ['Enter the lift door width'] : undefined),
    },
    {
      key: 'liftDoorWidth',
      validate: m =>
        m.lift && isInvalidNumber(m.liftDoorWidth) ? ['Lift door width must be a valid number'] : undefined,
    },
    {
      key: 'liftDoorWidth',
      validate: m =>
        m.lift && isBelowMin(m.liftDoorWidth, MIN_LIFT_DOOR_WIDTH_CM)
          ? ['Lift door width needs to be over 1cm']
          : undefined,
    },
    {
      key: 'liftDoorWidth',
      validate: m =>
        m.lift && isAboveMax(m.liftDoorWidth, MAX_LIFT_DOOR_WIDTH_CM)
          ? ['Lift door width needs to be under 1000cm']
          : undefined,
    },
    {
      key: 'liftDoorLimit',
      validate: m => (m.lift && isMissing(m.liftDoorLimit) ? ['Enter the lift weight limit'] : undefined),
    },
    {
      key: 'liftDoorLimit',
      validate: m =>
        m.lift && isInvalidNumber(m.liftDoorLimit) ? ['Lift weight limit must be a valid number'] : undefined,
    },
    {
      key: 'liftDoorLimit',
      validate: m =>
        m.lift && isBelowMin(m.liftDoorLimit, MIN_LIFT_DOOR_LIMIT_KG)
          ? ['Lift weight limit should be at least 1kg']
          : undefined,
    },
    {
      key: 'liftDoorLimit',
      validate: m =>
        m.lift && isAboveMax(m.liftDoorLimit, MAX_LIFT_DOOR_LIMIT_KG)
          ? ['Lift weight limit should be at most 10000kg']
          : undefined,
    },

    // Accessible entrance phone (required)
    {
      key: 'accessibleEntrancePhoneNumber',
      validate: m =>
        m.accessibleEntrance === false && !m.accessibleEntrancePhoneNumber?.trim()
          ? ['Enter a phone number for the accessible entrance']
          : undefined,
    },

    // Lift support phone (required when no lift)
    {
      key: 'liftSupportPhoneNumber',
      validate: m =>
        m.lift === false && !m.liftSupportPhoneNumber?.trim()
          ? ['Enter telephone number for organising support at court']
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
    patternRule(
      'liftSupportPhoneNumber',
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
    {
      key: 'accessibleToiletDescriptionCy',
      validate: m =>
        !m.accessibleToiletDescriptionCy?.trim()
          ? ['Enter a Welsh description of the accessible toilet facilities']
          : undefined,
    },

    // Toilet description pattern
    patternRule(
      'accessibleToiletDescription',
      TOILET_DESC_REGEX,
      'Accessible toilet description in English must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses'
    ),
    patternRule(
      'accessibleToiletDescriptionCy',
      TOILET_DESC_REGEX,
      'Accessible toilet description in Welsh must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses'
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
