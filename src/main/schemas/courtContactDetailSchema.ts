import { z } from 'zod';

import { contactDescriptionTypeSchema } from './contactDescriptionTypeSchema';

export const courtContactDetailSchema = z.object({
  id: z.string(),
  courtContactDescriptionId: z.string(),
  explanation: z.string().nullable(),
  explanationCy: z.string().nullable(),
  email: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  courtContactDescription: contactDescriptionTypeSchema.nullable().optional(),
});

export const courtContactDetailListSchema = z.array(courtContactDetailSchema);

export type CourtContactDetail = z.infer<typeof courtContactDetailSchema>;
