import { z } from 'zod';

export const dpaAddressSchema = z.object({
  UPRN: z.string().nullable(),
  UDPRN: z.string().nullable(),
  ADDRESS: z.string().nullable(),
  ORGANISATION_NAME: z.string().nullable(),
  BUILDING_NUMBER: z.string().nullable(),
  BUILDING_NAME: z.string().nullable(),
  THOROUGHFARE_NAME: z.string().nullable(),
  POST_TOWN: z.string().nullable(),
  POSTCODE: z.string().nullable(),
  LNG: z.number().nullable(),
  LAT: z.number().nullable(),
  LOCAL_CUSTODIAN_CODE: z.int32().nullable(),
  LOCAL_CUSTODIAN_CODE_DESCRIPTION: z.string().nullable(),
});

export const lpiAddressSchema = z.object({
  UPRN: z.string().nullable(),
  ADDRESS: z.string().nullable(),
  LPI_KEY: z.string().nullable(),
  ORGANISATION: z.string().nullable(),
  SAO_START_NUMBER: z.string().nullable(),
  SAO_START_SUFFIX: z.string().nullable(),
  SAO_END_NUMBER: z.string().nullable(),
  SAO_END_SUFFIX: z.string().nullable(),
  SAO_TEXT: z.string().nullable(),
  PAO_START_NUMBER: z.string().nullable(),
  PAO_START_SUFFIX: z.string().nullable(),
  PAO_END_NUMBER: z.string().nullable(),
  PAO_END_SUFFIX: z.string().nullable(),
  PAO_TEXT: z.string().nullable(),
  STREET_DESCRIPTION: z.string().nullable(),
  LOCALITY_NAME: z.string().nullable(),
  TOWN_NAME: z.string().nullable(),
  ADMINISTRATIVE_AREA: z.string().nullable(),
  POSTCODE_LOCATOR: z.string().nullable(),
  LNG: z.number().nullable(),
  LAT: z.number().nullable(),
});

const resultItemSchema = z.object({
  DPA: dpaAddressSchema.nullable().optional(),
  LPI: lpiAddressSchema.nullable().optional(),
});

export const osDataSchema = z.object({
  results: z.array(resultItemSchema),
});

export const osAddressOptionSchema = z.object({
  dataset: z.enum(['DPA', 'LPI']),
  uprn: z.string(),
  lpiKey: z.string().nullable(),
  address: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  townCity: z.string(),
  county: z.string().nullable(),
  postcode: z.string(),
  selectionPostcode: z.string(),
});

export type OsData = z.infer<typeof osDataSchema>;
export type DpaAddress = z.infer<typeof dpaAddressSchema>;
export type LpiAddress = z.infer<typeof lpiAddressSchema>;
export type OsAddressOption = z.infer<typeof osAddressOptionSchema>;
