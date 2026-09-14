// eslint-disable-next-line import/namespace
import type { AccessibilityModel } from '../services/courts/CourtAccessibilityService';

import { Rule, addError, patternRule, validateBooleanField } from './validation';
import {
  COURT_ACCESSIBILITY_ENTRANCE_PHONE_REQUIRED_MESSAGE,
  COURT_ACCESSIBILITY_ENTRANCE_REQUIRED_MESSAGE,
  COURT_ACCESSIBILITY_HEARING_EQUIPMENT_REQUIRED_MESSAGE,
  COURT_ACCESSIBILITY_LIFT_DOOR_WIDTH_INVALID_NUMBER_MESSAGE,
  COURT_ACCESSIBILITY_LIFT_DOOR_WIDTH_MAX_MESSAGE,
  COURT_ACCESSIBILITY_LIFT_DOOR_WIDTH_MIN_MESSAGE,
  COURT_ACCESSIBILITY_LIFT_DOOR_WIDTH_REQUIRED_MESSAGE,
  COURT_ACCESSIBILITY_LIFT_REQUIRED_MESSAGE,
  COURT_ACCESSIBILITY_LIFT_SUPPORT_PHONE_REQUIRED_MESSAGE,
  COURT_ACCESSIBILITY_LIFT_WEIGHT_LIMIT_INVALID_NUMBER_MESSAGE,
  COURT_ACCESSIBILITY_LIFT_WEIGHT_LIMIT_MAX_MESSAGE,
  COURT_ACCESSIBILITY_LIFT_WEIGHT_LIMIT_MIN_MESSAGE,
  COURT_ACCESSIBILITY_LIFT_WEIGHT_LIMIT_REQUIRED_MESSAGE,
  COURT_ACCESSIBILITY_PARKING_REQUIRED_MESSAGE,
  COURT_ACCESSIBILITY_PHONE_NUMBER_INVALID_MESSAGE,
  COURT_ACCESSIBILITY_QUIET_ROOM_REQUIRED_MESSAGE,
  COURT_ACCESSIBILITY_TOILET_DESCRIPTION_INVALID_CHARACTERS_MESSAGE,
  COURT_ACCESSIBILITY_TOILET_DESCRIPTION_REQUIRED_MESSAGE,
  COURT_ACCESSIBILITY_TOILET_DESCRIPTION_WELSH_INVALID_CHARACTERS_MESSAGE,
  COURT_ACCESSIBILITY_TOILET_DESCRIPTION_WELSH_REQUIRED_MESSAGE,
  MAX_LIFT_DOOR_LIMIT_KG,
  MAX_LIFT_DOOR_WIDTH_CM,
  MIN_LIFT_DOOR_LIMIT_KG,
  MIN_LIFT_DOOR_WIDTH_CM,
  PHONE_NUMBER_REGEX,
  TOILET_DESC_REGEX,
  TOILET_DESC_REGEX_WELSH,
} from './variablesConstants';

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
      validate: m => validateBooleanField(m.accessibleParking, COURT_ACCESSIBILITY_PARKING_REQUIRED_MESSAGE),
    },
    {
      key: 'accessibleEntrance',
      validate: m => validateBooleanField(m.accessibleEntrance, COURT_ACCESSIBILITY_ENTRANCE_REQUIRED_MESSAGE),
    },
    {
      key: 'lift',
      validate: m => validateBooleanField(m.lift, COURT_ACCESSIBILITY_LIFT_REQUIRED_MESSAGE),
    },
    {
      key: 'quietRoom',
      validate: m => validateBooleanField(m.quietRoom, COURT_ACCESSIBILITY_QUIET_ROOM_REQUIRED_MESSAGE),
    },

    // Lift conditionals
    {
      key: 'liftDoorWidth',
      validate: m =>
        m.lift && isMissing(m.liftDoorWidth) ? [COURT_ACCESSIBILITY_LIFT_DOOR_WIDTH_REQUIRED_MESSAGE] : undefined,
    },
    {
      key: 'liftDoorWidth',
      validate: m =>
        m.lift && isInvalidNumber(m.liftDoorWidth)
          ? [COURT_ACCESSIBILITY_LIFT_DOOR_WIDTH_INVALID_NUMBER_MESSAGE]
          : undefined,
    },
    {
      key: 'liftDoorWidth',
      validate: m =>
        m.lift && isBelowMin(m.liftDoorWidth, MIN_LIFT_DOOR_WIDTH_CM)
          ? [COURT_ACCESSIBILITY_LIFT_DOOR_WIDTH_MIN_MESSAGE]
          : undefined,
    },
    {
      key: 'liftDoorWidth',
      validate: m =>
        m.lift && isAboveMax(m.liftDoorWidth, MAX_LIFT_DOOR_WIDTH_CM)
          ? [COURT_ACCESSIBILITY_LIFT_DOOR_WIDTH_MAX_MESSAGE]
          : undefined,
    },
    {
      key: 'liftDoorLimit',
      validate: m =>
        m.lift && isMissing(m.liftDoorLimit) ? [COURT_ACCESSIBILITY_LIFT_WEIGHT_LIMIT_REQUIRED_MESSAGE] : undefined,
    },
    {
      key: 'liftDoorLimit',
      validate: m =>
        m.lift && isInvalidNumber(m.liftDoorLimit)
          ? [COURT_ACCESSIBILITY_LIFT_WEIGHT_LIMIT_INVALID_NUMBER_MESSAGE]
          : undefined,
    },
    {
      key: 'liftDoorLimit',
      validate: m =>
        m.lift && isBelowMin(m.liftDoorLimit, MIN_LIFT_DOOR_LIMIT_KG)
          ? [COURT_ACCESSIBILITY_LIFT_WEIGHT_LIMIT_MIN_MESSAGE]
          : undefined,
    },
    {
      key: 'liftDoorLimit',
      validate: m =>
        m.lift && isAboveMax(m.liftDoorLimit, MAX_LIFT_DOOR_LIMIT_KG)
          ? [COURT_ACCESSIBILITY_LIFT_WEIGHT_LIMIT_MAX_MESSAGE]
          : undefined,
    },

    // Accessible entrance phone (required)
    {
      key: 'accessibleEntrancePhoneNumber',
      validate: m =>
        m.accessibleEntrance === false && !m.accessibleEntrancePhoneNumber?.trim()
          ? [COURT_ACCESSIBILITY_ENTRANCE_PHONE_REQUIRED_MESSAGE]
          : undefined,
    },

    // Lift support phone (required when no lift)
    {
      key: 'liftSupportPhoneNumber',
      validate: m =>
        m.lift === false && !m.liftSupportPhoneNumber?.trim()
          ? [COURT_ACCESSIBILITY_LIFT_SUPPORT_PHONE_REQUIRED_MESSAGE]
          : undefined,
    },

    // Phone pattern
    patternRule('accessibleParkingPhoneNumber', PHONE_NUMBER_REGEX, COURT_ACCESSIBILITY_PHONE_NUMBER_INVALID_MESSAGE),
    patternRule('accessibleEntrancePhoneNumber', PHONE_NUMBER_REGEX, COURT_ACCESSIBILITY_PHONE_NUMBER_INVALID_MESSAGE),
    patternRule('liftSupportPhoneNumber', PHONE_NUMBER_REGEX, COURT_ACCESSIBILITY_PHONE_NUMBER_INVALID_MESSAGE),

    // Accessible toilet description (required)
    {
      key: 'accessibleToiletDescription',
      validate: m =>
        !m.accessibleToiletDescription?.trim() ? [COURT_ACCESSIBILITY_TOILET_DESCRIPTION_REQUIRED_MESSAGE] : undefined,
    },
    {
      key: 'accessibleToiletDescriptionCy',
      validate: m =>
        !m.accessibleToiletDescriptionCy?.trim()
          ? [COURT_ACCESSIBILITY_TOILET_DESCRIPTION_WELSH_REQUIRED_MESSAGE]
          : undefined,
    },

    // Toilet description pattern
    patternRule(
      'accessibleToiletDescription',
      TOILET_DESC_REGEX,
      COURT_ACCESSIBILITY_TOILET_DESCRIPTION_INVALID_CHARACTERS_MESSAGE
    ),
    patternRule(
      'accessibleToiletDescriptionCy',
      TOILET_DESC_REGEX_WELSH,
      COURT_ACCESSIBILITY_TOILET_DESCRIPTION_WELSH_INVALID_CHARACTERS_MESSAGE
    ),

    // Hearing equipment
    {
      key: 'hearingEnhancementEquipment',
      validate: m =>
        !m.hearingEnhancementEquipment ? [COURT_ACCESSIBILITY_HEARING_EQUIPMENT_REQUIRED_MESSAGE] : undefined,
    },
  ];

  // Run all rules
  for (const rule of rules) {
    addError(errors, rule.key as string, rule.validate(model));
  }

  return Object.keys(errors).length ? errors : undefined;
};
