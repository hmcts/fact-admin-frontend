import { z } from 'zod';

import { ADDRESS_TYPE } from '../utils/variablesConstants';


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
  addressType: ADDRESS_TYPE,
  areasOfLaw: z.array(z.string()).nullable(),
  courtTypes: z.array(z.string()).nullable(),
});

export const courtAddressListSchema = z.array(courtAddressSchema);

export type CourtAddress = z.infer<typeof courtAddressSchema>;
export const CourtAddressType = ADDRESS_TYPE.enum;
