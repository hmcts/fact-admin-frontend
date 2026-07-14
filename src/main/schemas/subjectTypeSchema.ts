import { z } from 'zod';

export const subjectTypeSchema = z.enum(['COURT', 'SERVICE_CENTRE']);
export const SubjectType = subjectTypeSchema.enum;
export type Subject = (typeof SubjectType)[keyof typeof SubjectType];
