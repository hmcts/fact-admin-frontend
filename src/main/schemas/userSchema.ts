import { z } from 'zod';

export const userSchema = z.object({
  email: z.string().email(),
  favouriteCourts: z.array(z.string().uuid()).nullable(),
  id: z.string().uuid(),
  lastLogin: z.string(),
  role: z.string(),
  ssoId: z.string().uuid(),
});

export type User = z.infer<typeof userSchema>;
