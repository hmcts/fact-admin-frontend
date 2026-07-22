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
    fileLink: addCacheBuster(courtPhoto.fileLink),
  }));

function addCacheBuster(fileLink: string | null | undefined): string | undefined {
  if (!fileLink) {
    return undefined;
  }

  const url = new URL(fileLink);
  url.searchParams.set('cacheBust', crypto.randomUUID());
  return url.toString();
}

export type CourtPhoto = z.infer<typeof courtPhotoSchema>;
