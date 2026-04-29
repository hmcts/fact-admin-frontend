import { z } from 'zod';

const courtRegionSchema = z.object({
  name: z.string(),
  country: z.string(),
});

const courtCodeSchema = z.object({
  magistrateCourtCode: z.number().nullable(),
  familyCourtCode: z.number().nullable(),
  tribunalCode: z.number().nullable(),
  countyCourtCode: z.number().nullable(),
  crownCourtCode: z.number().nullable(),
  gbs: z.string().nullable(),
});

const courtDxCodeSchema = z.object({
  dxCode: z.string(),
  explanation: z.string().nullable(),
});

const courtFaxNumberSchema = z.object({
  faxNumber: z.string(),
  description: z.string().nullable(),
});

const courtProfessionalInformationSchema = z.object({
  interviewRooms: z.boolean(),
  interviewRoomCount: z.number().nullable(),
  interviewPhoneNumber: z.string().nullable(),
  videoHearings: z.boolean(),
  commonPlatform: z.boolean(),
  accessScheme: z.boolean(),
});

const areaOfLawSchema = z.object({
  name: z.string(),
  nameCy: z.string(),
  externalLink: z.string().nullable(),
  externalLinkCy: z.string().nullable(),
  displayName: z.string().nullable(),
  displayNameCy: z.string().nullable(),
});

const courtAreasOfLawSchema = z.object({
  areasOfLaw: z.array(areaOfLawSchema),
});

const courtFacilitiesSchema = z.object({
  parking: z.boolean(),
  freeWaterDispensers: z.boolean(),
  snackVendingMachines: z.boolean(),
  drinkVendingMachines: z.boolean(),
  cafeteria: z.boolean(),
  waitingArea: z.boolean(),
  waitingAreaChildren: z.boolean(),
  quietRoom: z.boolean(),
  babyChanging: z.boolean(),
  wifi: z.boolean(),
});

const courtTranslationSchema = z.object({
  email: z.string(),
  phoneNumber: z.string(),
});

const courtContactDescriptionSchema = z.object({
  name: z.string(),
  nameCy: z.string(),
});

const courtContactDetailSchema = z.object({
  courtContactDescriptionId: z.string(),
  explanation: z.string().nullable(),
  explanationCy: z.string().nullable(),
  email: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  courtContactDescription: courtContactDescriptionSchema,
});

const openingTimesDetailSchema = z.object({
  dayOfWeek: z.string(),
  openingTime: z.string(),
  closingTime: z.string(),
});

const courtTypeSchema = z.object({
  name: z.string(),
});

const courtCounterServiceOpeningHourSchema = z.object({
  counterService: z.boolean(),
  assistWithForms: z.boolean(),
  assistWithDocuments: z.boolean(),
  assistWithSupport: z.boolean(),
  appointmentNeeded: z.boolean(),
  appointmentContact: z.string().nullable(),
  openingTimesDetails: z.array(openingTimesDetailSchema),
  courtTypes: z.array(courtTypeSchema).nullable().optional(),
});

const openingHourTypeSchema = z.object({
  name: z.string(),
  nameCy: z.string(),
});

const courtOpeningHourSchema = z.object({
  openingTimesDetails: z.array(openingTimesDetailSchema),
  openingHourType: openingHourTypeSchema,
});

export const courtAddressTypeSchema = z.enum(['VISIT_US', 'WRITE_TO_US', 'VISIT_OR_CONTACT_US']);

const courtAddressSchema = z.object({
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  townCity: z.string(),
  county: z.string().nullable(),
  postcode: z.string(),
  epimId: z.string().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  addressType: courtAddressTypeSchema,
  areasOfLaw: z.array(areaOfLawSchema),
  courtTypes: z.array(courtTypeSchema),
});

const hearingEnhancementEquipmentSchema = z.enum([
  'INFRARED_SYSTEMS_AND_HEARING_LOOP_SYSTEMS',
  'INFRARED_SYSTEMS',
  'HEARING_LOOP_SYSTEMS',
]);

const courtAccessibilityOptionSchema = z.object({
  accessibleParking: z.boolean(),
  accessibleParkingPhoneNumber: z.string().nullable(),
  accessibleToiletDescription: z.string().nullable(),
  accessibleToiletDescriptionCy: z.string().nullable(),
  accessibleEntrance: z.boolean(),
  accessibleEntrancePhoneNumber: z.string().nullable(),
  hearingEnhancementEquipment: hearingEnhancementEquipmentSchema,
  lift: z.boolean(),
  liftDoorWidth: z.number().nullable(),
  liftDoorLimit: z.number().nullable(),
  quietRoom: z.boolean(),
});

const courtPhotoSchema = z.object({
  fileLink: z.string(),
  lastUpdatedAt: z.string(),
});

export const courtDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  open: z.boolean(),
  warningNotice: z.string().nullable(),
  lastUpdatedAt: z.string(),
  openOnCath: z.boolean().nullable(),
  mrdId: z.string().nullable(),
  region: courtRegionSchema,
  courtDxCodes: z.array(courtDxCodeSchema),
  courtCodes: z.array(courtCodeSchema),
  courtFaxNumbers: z.array(courtFaxNumberSchema),
  courtAddresses: z.array(courtAddressSchema),
  courtOpeningHours: z.array(courtOpeningHourSchema),
  courtCounterServiceOpeningHours: z.array(courtCounterServiceOpeningHourSchema),
  courtContactDetails: z.array(courtContactDetailSchema),
  courtTranslations: z.array(courtTranslationSchema),
  courtAccessibilityOptions: z.array(courtAccessibilityOptionSchema),
  courtFacilities: z.array(courtFacilitiesSchema),
  courtProfessionalInformation: z.array(courtProfessionalInformationSchema),
  courtAreasOfLaw: z.array(courtAreasOfLawSchema),
  courtPhotos: z.array(courtPhotoSchema),
});

export const courtDetailsListSchema = z.array(courtDetailsSchema);

export type CourtDetails = z.infer<typeof courtDetailsSchema>;
