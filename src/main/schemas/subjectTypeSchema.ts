import { SUBJECT_TYPE } from '../utils/constants/messageConstants';

export const subjectTypeSchema = SUBJECT_TYPE;
export const SubjectType = subjectTypeSchema.enum;
export type Subject = (typeof SubjectType)[keyof typeof SubjectType];
