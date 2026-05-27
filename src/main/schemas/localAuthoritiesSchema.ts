import { z } from 'zod';

export const localAuthoritySelectionSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  selected: z.boolean(),
});

export const courtLocalAuthoritiesSchema = z.object({
  areaOfLawId: z.string(),
  areaOfLawName: z.string().nullable(),
  localAuthorities: z.array(localAuthoritySelectionSchema),
});

export const courtLocalAuthoritiesListSchema = z.array(courtLocalAuthoritiesSchema);

export type LocalAuthoritySelection = z.infer<typeof localAuthoritySelectionSchema>;
export type CourtLocalAuthorities = z.infer<typeof courtLocalAuthoritiesSchema>;
export type CourtLocalAuthoritiesList = z.infer<typeof courtLocalAuthoritiesListSchema>;
