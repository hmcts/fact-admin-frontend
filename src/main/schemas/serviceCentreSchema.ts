import { z } from 'zod';

export const serviceCentreSchema = z
  .object({
    catchmentType: z.enum(['LOCAL', 'NATIONAL', 'REGIONAL']).nullable().optional(),
    createdAt: z.string().optional(),
    id: z.string().uuid(),
    lastUpdatedAt: z.string().optional(),
    name: z.string(),
    open: z.boolean(),
    regionId: z.string().uuid().nullable().optional(),
    serviceAreaIds: z.array(z.string().uuid()).optional(),
    slug: z.string(),
    warningNotice: z.string().nullable().optional(),
  })
  .passthrough();

export type ServiceCentre = z.infer<typeof serviceCentreSchema>;
