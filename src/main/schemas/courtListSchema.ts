import { z } from 'zod';

export const courtListItemSchema = z.object({
  id: z.string().uuid(),
  isServiceCentre: z.boolean(),
  lastUpdatedAt: z.string(),
  name: z.string(),
  open: z.boolean(),
  regionId: z.string().uuid(),
  slug: z.string(),
});

export const pageMetadataSchema = z.object({
  number: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});

export const pagedCourtsSchema = z.object({
  content: z.array(courtListItemSchema),
  page: pageMetadataSchema,
});

export type CourtListItem = z.infer<typeof courtListItemSchema>;
export type PagedCourts = z.infer<typeof pagedCourtsSchema>;
