import { z } from 'zod';

export const courtTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const courtTypeListSchema = z.array(courtTypeSchema);

export type CourtType = z.infer<typeof courtTypeSchema>;
