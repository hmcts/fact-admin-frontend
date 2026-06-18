import { z } from 'zod';

import { pageMetadataSchema } from './pagedMetadataSchema';
import { userSchema } from './userSchema';

const courtNameAndIdSchema = z.object({
  name: z.string(),
  id: z.string(),
});

export const courtNameAndIdListSchema = z.array(courtNameAndIdSchema);

const actionDataDiffSchema = z.object({
  field: z.string(),
  oldValue: z.any().nullable(),
  newValue: z.any().nullable(),
});

const auditListItemSchema = z.object({
  id: z.string(),
  courtId: z.string(),
  userId: z.string(),
  user: userSchema,
  actionType: z.string(),
  actionEntity: z.string(),
  // TODO: DELETE actions don't contain a diff, might be better to ensure the API is returning an
  //       empty array instead of null for consistency
  actionDataDiff: z.array(actionDataDiffSchema).nullable(),
  createdAt: z.string(),
});

export const pagedAuditsSchema = z.object({
  content: z.array(auditListItemSchema),
  page: pageMetadataSchema,
});

export type PagedAudits = z.infer<typeof pagedAuditsSchema>;
export type CourtNameAndIdList = z.infer<typeof courtNameAndIdListSchema>;
