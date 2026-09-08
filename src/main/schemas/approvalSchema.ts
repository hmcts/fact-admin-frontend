import { z } from 'zod';

import { SUBJECT_TYPE } from '../utils/variablesConstants';


const approvalUserSchema = z.object({
  email: z.email().nullable().optional(),
  id: z.uuid().nullable().optional(),
  lastLogin: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  ssoId: z.uuid().nullable().optional(),
});

export const approvalStatusSchema = z.object({
  subjectId: z.uuid(),
  subjectType: SUBJECT_TYPE,
  name: z.string(),
  approved: z.boolean(),
  approvalId: z.uuid().nullable(),
  userId: z.uuid().nullable(),
  user: approvalUserSchema.nullable(),
  lastUpdatedAt: z.string().nullable(),
});

export const approvalStatusListSchema = z.array(approvalStatusSchema);

export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
export type ApprovalSubjectType = z.infer<typeof SUBJECT_TYPE>;

export type CreateApprovalRequest = {
  subjectId: string;
  subjectType: ApprovalSubjectType;
  userId: string;
};
