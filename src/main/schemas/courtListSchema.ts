import { z } from 'zod';

import { SUBJECT_TYPE } from '../utils/variablesConstants';

import { pageMetadataSchema } from './pagedMetadataSchema';


export const locationListItemSchema = z.object({
  createdAt: z.string().nullable(),
  id: z.string().uuid(),
  lastUpdatedAt: z.string(),
  locationType: SUBJECT_TYPE,
  mrdId: z.string().nullable(),
  name: z.string(),
  open: z.boolean(),
  openOnCath: z.boolean().nullable(),
  regionId: z.string().uuid().nullable(),
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
export type PagedCourts = PagedLocations;
