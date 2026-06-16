import { z } from 'zod';

export const HEARING_ENHANCEMENT_EQUIPMENT_MAP = {
  infraredAndHearingLoop: 'INFRARED_SYSTEMS_AND_HEARING_LOOP_SYSTEMS',
  infrared: 'INFRARED_SYSTEMS',
  hearingLoop: 'HEARING_LOOP_SYSTEMS',
} as const;

export type HearingEnhancementEquipmentUi = keyof typeof HEARING_ENHANCEMENT_EQUIPMENT_MAP;
export type HearingEnhancementEquipmentApi = (typeof HEARING_ENHANCEMENT_EQUIPMENT_MAP)[HearingEnhancementEquipmentUi];

const HEARING_ENHANCEMENT_UI_OPTIONS = Object.keys(
  HEARING_ENHANCEMENT_EQUIPMENT_MAP
) as HearingEnhancementEquipmentUi[];
const HEARING_ENHANCEMENT_API_OPTIONS = Object.values(
  HEARING_ENHANCEMENT_EQUIPMENT_MAP
) as HearingEnhancementEquipmentApi[];

export const HearingEnhancementEquipmentEnum = z.enum(
  HEARING_ENHANCEMENT_UI_OPTIONS as [HearingEnhancementEquipmentUi, ...HearingEnhancementEquipmentUi[]]
);

const HearingEnhancementEquipmentApiEnum = z.enum(
  HEARING_ENHANCEMENT_API_OPTIONS as [HearingEnhancementEquipmentApi, ...HearingEnhancementEquipmentApi[]]
);

const HEARING_ENHANCEMENT_EQUIPMENT_MAP_REVERSE = {
  INFRARED_SYSTEMS_AND_HEARING_LOOP_SYSTEMS: 'infraredAndHearingLoop',
  INFRARED_SYSTEMS: 'infrared',
  HEARING_LOOP_SYSTEMS: 'hearingLoop',
} as const satisfies Record<HearingEnhancementEquipmentApi, HearingEnhancementEquipmentUi>;

const normalizeHearingEnhancementEquipment = (
  value: HearingEnhancementEquipmentUi | HearingEnhancementEquipmentApi | undefined
): HearingEnhancementEquipmentUi | undefined => {
  if (!value) {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(HEARING_ENHANCEMENT_EQUIPMENT_MAP_REVERSE, value)) {
    return HEARING_ENHANCEMENT_EQUIPMENT_MAP_REVERSE[value as HearingEnhancementEquipmentApi];
  }

  if (Object.prototype.hasOwnProperty.call(HEARING_ENHANCEMENT_EQUIPMENT_MAP, value)) {
    return value as HearingEnhancementEquipmentUi;
  }

  return undefined;
};

export const AccessibilityScheme = z.object({
  id: z.string(),
  courtId: z.string(),
  accessibleParking: z.boolean().optional(),
  accessibleParkingPhoneNumber: z.string().optional(),
  accessibleToiletDescription: z.string().optional(),
  accessibleToiletDescriptionCy: z
    .string()
    .optional()
    .nullable()
    .transform(value => value ?? 'welsh not available yet'),
  accessibleEntrance: z.boolean().optional(),
  accessibleEntrancePhoneNumber: z.string().optional().nullable(),
  hearingEnhancementEquipment: z
    .union([HearingEnhancementEquipmentEnum, HearingEnhancementEquipmentApiEnum])
    .optional()
    .transform(normalizeHearingEnhancementEquipment),
  lift: z.boolean().optional(),
  // Values come from form inputs as text and may be normalised later.
  liftDoorWidth: z.number().optional().nullable(),
  liftDoorLimit: z.number().optional().nullable(),
  quietRoom: z.boolean().optional(),
});

export type Accessibility = z.infer<typeof AccessibilityScheme>;
