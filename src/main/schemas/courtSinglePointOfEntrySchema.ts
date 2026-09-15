import { z } from 'zod';

export const courtSinglePointOfEntrySchema = z.object({
  id: z.uuid(),
  name: z.string().nullable().optional(),
  nameCy: z.string().nullable().optional(),
  selected: z.boolean(),
});

export const courtSinglePointOfEntryListSchema = z.array(courtSinglePointOfEntrySchema);

export type CourtSinglePointOfEntryList = z.infer<typeof courtSinglePointOfEntryListSchema>;
