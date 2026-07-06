import { z } from 'zod';

import { userSchema } from './userSchema';

const pageSchema = z.enum([
  'COURT',
  'COURT_ADDRESS',
  'COURT_ACCESSIBILITY',
  'COURT_CASES_HEARD',
  'COURT_CONTACT_DETAILS',
  'COURT_COUNTER_SERVICE_OPENING_HOURS',
  'COURT_COURT_OPENING_HOURS',
  'COURT_BUILDING_FACILITIES',
  'COURT_INFORMATION_FOR_PROFESSIONALS',
  'COURT_LOCAL_AUTHORITIES',
  'COURT_PHOTO',
  'COURT_TRANSLATION_AND_INTERPRETATION',
  'COURT_WARNING_NOTICE',
]);

export const courtLockSchema = z.object({
  id: z.uuid(),
  courtId: z.uuid(),
  userId: z.uuid(),
  user: userSchema,
  page: pageSchema,
  lockAcquired: z.string(),
});

export const courtLockListSchema = z.array(courtLockSchema);

export type CourtLock = z.infer<typeof courtLockSchema>;
export type CourtLockList = z.infer<typeof courtLockListSchema>;
export const Page = pageSchema.enum;

export const PATH_TO_PAGE_MAP = {
  address: Page.COURT_ADDRESS,
  accessibility: Page.COURT_ACCESSIBILITY,
  'cases-heard': Page.COURT_CASES_HEARD,
  'contact-details': Page.COURT_CONTACT_DETAILS,
  'counter-service-opening-hours': Page.COURT_COUNTER_SERVICE_OPENING_HOURS,
  'court-opening-hours': Page.COURT_COURT_OPENING_HOURS,
  general: Page.COURT,
  'building-facilities': Page.COURT_BUILDING_FACILITIES,
  'information-for-professionals': Page.COURT_INFORMATION_FOR_PROFESSIONALS,
  'local-authorities': Page.COURT_LOCAL_AUTHORITIES,
  photo: Page.COURT_PHOTO,
  'translation-and-interpretation': Page.COURT_TRANSLATION_AND_INTERPRETATION,
  'warning-notice': Page.COURT_WARNING_NOTICE,
};
