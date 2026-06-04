import { z } from 'zod';

export const translationServicesSchema = z.object({
  courtId: z.string(),
  email: z.string().nullable().optional(),
  id: z.string().optional(),
  phoneNumber: z.string().nullable().optional(),
});

export type TranslationServices = z.infer<typeof translationServicesSchema>;
