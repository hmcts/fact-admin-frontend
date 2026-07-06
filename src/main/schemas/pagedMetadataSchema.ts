import { z } from 'zod';

export const pageMetadataSchema = z.object({
  number: z.number(),
  size: z.number(),
  totalElements: z.number(),
  totalPages: z.number(),
});
