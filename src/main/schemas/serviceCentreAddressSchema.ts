import { z } from 'zod';

import { ADDRESS_TYPE } from '../utils/variablesConstants';

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
  addressType: ADDRESS_TYPE,
});

export const serviceCentreAddressListSchema = z.array(serviceCentreAddressSchema);

export type ServiceCentreAddress = z.infer<typeof serviceCentreAddressSchema>;
export const ServiceCentreAddressType = ADDRESS_TYPE.enum;
