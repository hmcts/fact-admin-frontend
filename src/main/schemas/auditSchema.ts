import { z } from 'zod';

import { pageMetadataSchema } from './pagedMetadataSchema';
import { userSchema } from './userSchema';

const auditSubjectTypeSchema = z.enum(['COURT', 'SERVICE_CENTRE']);

export const auditSubjectOptionsSchema = z.map(
  auditSubjectTypeSchema,
  z.array(
    z.object({
      name: z.string(),
      id: z.uuid(),
    })
  )
);

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
export type AuditSubjectOptionsMap = z.infer<typeof auditSubjectOptionsSchema>;
export const AuditSubject = auditSubjectTypeSchema.enum;
