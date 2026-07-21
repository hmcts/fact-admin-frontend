import { z } from 'zod';

import { areaOfLawSchema } from './areaOfLawSchema';
import { courtAddressSchema } from './courtAddressSchema';
import { courtTypeSchema } from './courtTypeSchema';

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

const courtAreasOfLawSchema = z.object({
  areasOfLaw: z.array(z.union([areaOfLawSchema, z.string()])),
});

const courtFacilitiesSchema = z.object({
  parking: z.boolean(),
  freeWaterDispensers: z.boolean(),
  snackVendingMachines: z.boolean(),
  drinkVendingMachines: z.boolean(),
  cafeteria: z.boolean(),
  waitingArea: z.boolean(),
  waitingAreaChildren: z
    .boolean()
    .nullable()
    .transform(value => value ?? false),
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

const courtDetailsAddressSchema = courtAddressSchema.omit({ areasOfLaw: true, courtTypes: true }).extend({
  areasOfLaw: z.array(areaOfLawSchema).nullable(),
  courtTypes: z.array(courtTypeSchema).nullable(),
});

const nullableString = z.string().nullable();

const serviceCentreAddressSchema = z.object({
  id: z.string().nullable().optional(),
  serviceCentreId: z.string().optional(),
  addressLine1: nullableString.optional(),
  addressLine2: nullableString.optional(),
  townCity: nullableString.optional(),
  county: nullableString.optional(),
  postcode: nullableString.optional(),
  lat: z.number().nullable().optional(),
  lon: z.number().nullable().optional(),
  addressType: z.enum(['VISIT_US', 'WRITE_TO_US', 'VISIT_OR_CONTACT_US']),
});

const serviceCentreContactDescriptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameCy: z.string(),
});

const serviceCentreContactDetailSchema = z.object({
  id: z.string().optional(),
  serviceCentreId: z.string().optional(),
  explanation: nullableString.optional(),
  explanationCy: nullableString.optional(),
  email: nullableString.optional(),
  phoneNumber: nullableString.optional(),
  serviceCentreContactDescription: serviceCentreContactDescriptionSchema.nullable().optional(),
});

const serviceCentreAreasOfLawSchema = z.object({
  id: z.string().optional(),
  serviceCentreId: z.string().optional(),
  areasOfLaw: z
    .array(z.union([areaOfLawSchema, z.string()]))
    .nullable()
    .optional(),
});

const serviceAreaSchema = z.union([
  z
    .object({
      id: z.string(),
      name: z.string().nullable().optional(),
      nameCy: z.string().nullable().optional(),
    })
    .passthrough(),
  z.string(),
]);

export const courtDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  open: z.boolean(),
  warningNotice: z.string().nullable(),
  warningNoticeCy: z.string().nullable(),
  lastUpdatedAt: z.string(),
  openOnCath: z.boolean().nullable(),
  mrdId: z.string().nullable(),
  region: courtRegionSchema,
  courtDxCodes: z.array(courtDxCodeSchema),
  courtCodes: z.array(courtCodeSchema),
  courtFaxNumbers: z.array(courtFaxNumberSchema),
  courtAddresses: z.array(courtDetailsAddressSchema),
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

export const serviceCentreDetailsSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  open: z.boolean(),
  warningNotice: nullableString.optional(),
  warningNoticeCy: nullableString.optional(),
  createdAt: nullableString.optional(),
  lastUpdatedAt: z.string(),
  serviceAreas: z.array(serviceAreaSchema).optional().default([]),
  catchmentType: z.enum(['LOCAL', 'NATIONAL', 'REGIONAL']).nullable().optional(),
  serviceCentreAddresses: z.array(serviceCentreAddressSchema).optional().default([]),
  serviceCentreContactDetails: z.array(serviceCentreContactDetailSchema).optional().default([]),
  serviceCentreAreasOfLaw: z.array(serviceCentreAreasOfLawSchema).optional().default([]),
});

export const allLocationDetailsSchema = z.discriminatedUnion('locationType', [
  z.object({
    locationType: z.literal('COURT'),
    serviceCentre: z.literal(false),
    court: courtDetailsSchema,
    serviceCentreDetails: z.null(),
  }),
  z.object({
    locationType: z.literal('SERVICE_CENTRE'),
    serviceCentre: z.literal(true),
    court: z.null(),
    serviceCentreDetails: serviceCentreDetailsSchema,
  }),
]);

export const courtDetailsListSchema = z.array(courtDetailsSchema);
export const allLocationDetailsListSchema = z.array(allLocationDetailsSchema);

export type CourtDetails = z.infer<typeof courtDetailsSchema>;
export type ServiceCentreDetails = z.infer<typeof serviceCentreDetailsSchema>;
export type AllLocationDetails = z.infer<typeof allLocationDetailsSchema>;
