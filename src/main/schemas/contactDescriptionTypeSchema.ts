import { z } from 'zod';

export const contactDescriptionTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const contactDescriptionTypeListSchema = z.array(contactDescriptionTypeSchema);

export type ContactDescriptionType = z.infer<typeof contactDescriptionTypeSchema>;
