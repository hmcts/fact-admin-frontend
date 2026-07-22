import { z } from 'zod';

export const serviceCentreAddressTypeSchema = z.enum(['VISIT_US', 'WRITE_TO_US', 'VISIT_OR_CONTACT_US']);

export const serviceCentreAddressSchema = z.object({
  id: z.string().nullable(),
  serviceCentreId: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  townCity: z.string(),
  county: z.string().nullable(),
  postcode: z.string(),
  lat: z.number().nullable(),
  lon: z.number().nullable(),
  addressType: serviceCentreAddressTypeSchema,
});

export const serviceCentreAddressListSchema = z.array(serviceCentreAddressSchema);

export type ServiceCentreAddress = z.infer<typeof serviceCentreAddressSchema>;
export const ServiceCentreAddressType = serviceCentreAddressTypeSchema.enum;
