import { z } from 'zod';

export const openingHourTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameCy: z.string().nullable().optional(),
});

export const openingTimesDetailSchema = z.object({
  dayOfWeek: z.string(),
  openingTime: z.string(),
  closingTime: z.string(),
});

export const courtOpeningHoursSchema = z.object({
  id: z.string().optional(),
  courtId: z.string(),
  openingHourTypeId: z.string(),
  openingHourType: openingHourTypeSchema.nullable().optional(),
  openingTimesDetails: z.array(openingTimesDetailSchema),
});

export const openingHourTypeListSchema = z.array(openingHourTypeSchema);
export const courtOpeningHoursListSchema = z.array(courtOpeningHoursSchema);

export type OpeningHourType = z.infer<typeof openingHourTypeSchema>;
export type OpeningTimesDetail = z.infer<typeof openingTimesDetailSchema>;
export type CourtOpeningHours = z.infer<typeof courtOpeningHoursSchema>;
