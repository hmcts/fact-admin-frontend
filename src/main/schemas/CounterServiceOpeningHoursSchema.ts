import { z } from 'zod';

const openingTimesDetail = z.object({
  dayOfWeek: z.string(),
  openingTime: z.string(),
  closingTime: z.string(),
});

export const CounterServiceOpeningHoursSchema = z.object({
  id: z.string(),
  courtId: z.string(),
  counterService: z.boolean(),
  courtTypes: z.array(z.string()).optional().nullable(),
  assistWithForms: z.boolean(),
  assistWithDocuments: z.boolean(),
  assistWithSupport: z.boolean(),
  appointmentNeeded: z.boolean(),
  appointmentContact: z.string().optional().nullable(),
  // appointmentPhone: z.string().optional().nullable(),
  openingTimesDetails: z.array(openingTimesDetail),
});

export const CounterServiceOpeningHoursListSchema = z.array(CounterServiceOpeningHoursSchema);

export type OpeningTimeDetails = z.infer<typeof openingTimesDetail>;
export type CounterServiceOpeningHours = z.infer<typeof CounterServiceOpeningHoursSchema>;
