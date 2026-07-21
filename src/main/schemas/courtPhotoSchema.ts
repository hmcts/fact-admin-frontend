import { z } from 'zod';

export const courtPhotoSchema = z
  .object({
    id: z.uuid(),
    courtId: z.uuid(),
    fileLink: z.string().optional().nullable(),
    lastUpdatedAt: z.string(),
    updatedByUserId: z.uuid().optional().nullable(),
  })
  .transform(courtPhoto => ({
    // this is done to ensure that the photo link is unique. Azure's blob
    // storage will ignore the odd param in the request
    fileLink: courtPhoto.fileLink + '?' + crypto.randomUUID(),
  }));

export type CourtPhoto = z.infer<typeof courtPhotoSchema>;
