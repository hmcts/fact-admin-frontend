import { z } from 'zod';

export const userSchema = z.object({
  email: z.email(),
  favouriteCourts: z.array(z.uuid()).nullable(),
  id: z.uuid(),
  lastLogin: z.string(),
  role: z.string(),
  ssoId: z.uuid(),
});

export type User = z.infer<typeof userSchema>;
