import { z } from 'zod';

export const courtPhotoSchema = z.object({
  id: z.uuid(),
  courtId: z.uuid(),
  fileLink: z.string().optional().nullable(),
  lastUpdatedAt: z.string(),
  updatedByUserId: z.uuid().optional().nullable(),
});

export type CourtPhoto = z.infer<typeof courtPhotoSchema>;
