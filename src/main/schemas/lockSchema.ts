import { z } from 'zod';

import { subjectTypeSchema } from './subjectTypeSchema';
import { userSchema } from './userSchema';

const pageSchema = z.enum([
  'GENERAL',
  'ADDRESS',
  'ACCESSIBILITY',
  'CASES_HEARD',
  'CONTACT_DETAILS',
  'COUNTER_SERVICE_OPENING_HOURS',
  'OPENING_HOURS',
  'BUILDING_FACILITIES',
  'INFORMATION_FOR_PROFESSIONALS',
  'LOCAL_AUTHORITIES',
  'PHOTO',
  'TRANSLATION_AND_INTERPRETATION',
  'WARNING_NOTICE',
]);

export const lockSchema = z.object({
  id: z.uuid(),
  subjectType: subjectTypeSchema,
  subjectId: z.uuid(),
  userId: z.uuid(),
  user: userSchema,
  page: pageSchema,
  lockAcquired: z.string(),
});

export const lockListSchema = z.array(lockSchema);

export type Lock = z.infer<typeof lockSchema>;
export type LockList = z.infer<typeof lockListSchema>;
export const Page = pageSchema.enum;

export const PATH_TO_PAGE_MAP = {
  address: Page.ADDRESS,
  accessibility: Page.ACCESSIBILITY,
  'cases-heard': Page.CASES_HEARD,
  'contact-details': Page.CONTACT_DETAILS,
  'counter-service-opening-hours': Page.COUNTER_SERVICE_OPENING_HOURS,
  'court-opening-hours': Page.OPENING_HOURS,
  general: Page.GENERAL,
  'building-facilities': Page.BUILDING_FACILITIES,
  'information-for-professionals': Page.INFORMATION_FOR_PROFESSIONALS,
  'local-authorities': Page.LOCAL_AUTHORITIES,
  photo: Page.PHOTO,
  'translation-and-interpretation': Page.TRANSLATION_AND_INTERPRETATION,
  'warning-notice': Page.WARNING_NOTICE,
};
