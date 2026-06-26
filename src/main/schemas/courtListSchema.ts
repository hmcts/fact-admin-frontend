import { z } from 'zod';

import { pageMetadataSchema } from './pagedMetadataSchema';

export const courtListItemSchema = z.object({
  id: z.string().uuid(),
  lastUpdatedAt: z.string(),
  name: z.string(),
  open: z.boolean(),
  regionId: z.string().uuid(),
  slug: z.string(),
});

export const pagedCourtsSchema = z.object({
  content: z.array(courtListItemSchema),
  page: pageMetadataSchema,
});

export type CourtListItem = z.infer<typeof courtListItemSchema>;
export type PagedCourts = z.infer<typeof pagedCourtsSchema>;
