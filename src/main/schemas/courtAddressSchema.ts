import { z } from 'zod';

export const courtAddressTypeSchema = z.enum(['VISIT_US', 'WRITE_TO_US', 'VISIT_OR_CONTACT_US']);

export const courtAddressSchema = z.object({
  id: z.string().nullable(),
  courtId: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  townCity: z.string(),
  county: z.string().nullable(),
  postcode: z.string(),
  epimId: z.string().nullable(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  addressType: courtAddressTypeSchema,
  areasOfLaw: z.array(z.string()).nullable(),
  courtTypes: z.array(z.string()).nullable(),
});

export const courtAddressListSchema = z.array(courtAddressSchema);

export type CourtAddress = z.infer<typeof courtAddressSchema>;
export type CourtAddressType = z.infer<typeof courtAddressTypeSchema>;
