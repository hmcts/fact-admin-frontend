import { z } from 'zod';

export const serviceAreaSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    nameCy: z.string().optional(),
  });

export const serviceAreaListSchema = z.array(serviceAreaSchema);

export type ServiceArea = z.infer<typeof serviceAreaSchema>;
