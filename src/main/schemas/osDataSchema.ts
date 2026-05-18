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
  LNG: z.float32().nullable(),
  LAT: z.float32().nullable(),
  LOCAL_CUSTODIAN_CODE: z.int32().nullable(),
  LOCAL_CUSTODIAN_CODE_DESCRIPTION: z.string().nullable(),
});

const resultItemSchema = z.object({
  DPA: dpaAddressSchema.nullable()
});

export const osDataSchema = z.object({
  results: z.array(resultItemSchema),
});

export type OsData = z.infer<typeof osDataSchema>;
export type DpaAddress = z.infer<typeof dpaAddressSchema>;
