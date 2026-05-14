import { z } from 'zod';

export const areaOfLawSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameCy: z.string(),
  externalLink: z.string().nullable(),
  externalLinkCy: z.string().nullable(),
  displayName: z.string().nullable(),
  displayNameCy: z.string().nullable(),
});

export const areaOfLawListSchema = z.array(areaOfLawSchema);

export type AreaOfLaw = z.infer<typeof areaOfLawSchema>;
