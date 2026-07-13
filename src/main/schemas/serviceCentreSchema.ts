import { z } from 'zod';

export const serviceCentreSchema = z
  .object({
    catchmentType: z.enum(['LOCAL', 'NATIONAL', 'REGIONAL']).nullable().optional(),
    createdAt: z.string().optional(),
    id: z.uuid(),
    lastUpdatedAt: z.string().optional(),
    name: z.string(),
    open: z.boolean(),
    regionId: z.uuid().nullable().optional(),
    serviceAreaIds: z.array(z.uuid()).optional(),
    slug: z.string(),
    warningNotice: z.string().nullable().optional(),
  });

export type ServiceCentre = z.infer<typeof serviceCentreSchema>;
