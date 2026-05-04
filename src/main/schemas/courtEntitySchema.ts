import { z } from 'zod';

export const courtEntitySchema = z.object({
  createdAt: z.string(),
  id: z.string(),
  isServiceCentre: z.boolean(),
  lastUpdatedAt: z.string(),
  mrdId: z.string().nullable(),
  name: z.string(),
  open: z.boolean(),
  openOnCath: z.boolean().nullable(),
  regionId: z.string(),
  slug: z.string(),
  warningNotice: z.string().nullable(),
});

export type CourtEntity = z.infer<typeof courtEntitySchema>;
