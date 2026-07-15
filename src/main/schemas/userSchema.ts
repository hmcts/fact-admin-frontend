import { z } from 'zod';

export const userSchema = z.object({
  email: z.email(),
  id: z.uuid(),
  lastLogin: z.string(),
  role: z.string(),
  ssoId: z.uuid(),
});

export type User = z.infer<typeof userSchema>;
