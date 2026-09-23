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
    fileLink: replaceFileLink(courtPhoto.fileLink, courtPhoto.courtId),
  }));

function replaceFileLink(fileLink: string | null | undefined, courtId: string | null | undefined): string | undefined {
  if (!fileLink || !courtId) {
    return undefined;
  }

  return `/res/img/${courtId}?cacheBust=${crypto.randomUUID()}`;
}
