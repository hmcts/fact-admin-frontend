import { z } from 'zod';

import { pageMetadataSchema } from './pagedMetadataSchema';
import { userSchema } from './userSchema';

export const pagedUsersSchema = z.object({
  content: z.array(userSchema),
  page: pageMetadataSchema,
});

export type PagedUsers = z.infer<typeof pagedUsersSchema>;
