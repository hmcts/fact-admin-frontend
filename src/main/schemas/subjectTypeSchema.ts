import { SUBJECT_TYPE } from '../utils/variablesConstants';

export const subjectTypeSchema = SUBJECT_TYPE;
export const SubjectType = subjectTypeSchema.enum;
export type Subject = (typeof SubjectType)[keyof typeof SubjectType];
