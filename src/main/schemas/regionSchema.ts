import { z } from 'zod';

export const regionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  country: z.string(),
});

export const regionsSchema = z.array(regionSchema);

export type Region = z.infer<typeof regionSchema>;
