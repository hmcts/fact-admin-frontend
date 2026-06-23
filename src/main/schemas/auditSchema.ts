import { z } from 'zod';

import { courtEntitySchema } from './courtEntitySchema';
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

export const auditListItemSchema = z.object({
  id: z.string(),
  courtId: z.uuid(),
  court: z.nullable(courtEntitySchema),
  userId: z.uuid(),
  user: userSchema,
  actionType: z.string(),
  actionEntity: z.string(),
  actionDataDiff: z.array(actionDataDiffSchema).nullable(),
  createdAt: z.string(),
});

export const pagedAuditsSchema = z.object({
  content: z.array(auditListItemSchema),
  page: pageMetadataSchema,
});

export type PagedAudits = z.infer<typeof pagedAuditsSchema>;
export type Audit = z.infer<typeof auditListItemSchema>;
export type AuditSubjectOptionsMap = z.infer<typeof auditSubjectOptionsSchema>;
export const AuditSubject = auditSubjectTypeSchema.enum;
