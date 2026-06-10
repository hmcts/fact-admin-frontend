import { z } from 'zod';

const localAuthorityTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  custodianCode: z.int32(),
  childCustodianCodes: z.array(z.int32()).optional(),
});

export const localAuthorityTypeListSchema = z.array(localAuthorityTypeSchema);

export type LocalAuthorityType = z.infer<typeof localAuthorityTypeSchema>;
