import { z } from 'zod';

export const serviceAreaSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    nameCy: z.string().optional(),
  })
  .passthrough();

export const serviceAreaListSchema = z.array(serviceAreaSchema);

export type ServiceArea = z.infer<typeof serviceAreaSchema>;
