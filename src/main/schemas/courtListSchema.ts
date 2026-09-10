import { z } from 'zod';

import { pageMetadataSchema } from './pagedMetadataSchema';

export const locationTypeSchema = z.enum(['COURT', 'SERVICE_CENTRE']);

export const locationListItemSchema = z.object({
  createdAt: z.string().nullable(),
  id: z.uuid(),
  lastUpdatedAt: z.string(),
  locationType: locationTypeSchema,
  mrdId: z.string().nullable(),
  name: z.string(),
  open: z.boolean(),
  openOnCath: z.boolean().nullable(),
  regionId: z.uuid().nullable(),
  serviceCentre: z.boolean(),
  slug: z.string(),
  warningNotice: z.string().nullable(),
});

export const pagedLocationsSchema = z.object({
  content: z.array(locationListItemSchema),
  page: pageMetadataSchema,
});

export const pagedCourtsSchema = pagedLocationsSchema;

export type LocationListItem = z.infer<typeof locationListItemSchema>;
export type PagedLocations = z.infer<typeof pagedLocationsSchema>;
