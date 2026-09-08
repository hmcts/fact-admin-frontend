import { SUBJECT_TYPE } from '../utils/variablesConstants';

export const SubjectType = SUBJECT_TYPE.enum;
export type Subject = (typeof SubjectType)[keyof typeof SubjectType];
