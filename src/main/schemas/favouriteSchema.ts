import { z } from 'zod';

import { pagedLocationsSchema } from './courtListSchema';
import { subjectTypeSchema } from './subjectTypeSchema';

export const favouriteReferenceSchema = z.object({
  subjectId: z.uuid(),
  subjectType: subjectTypeSchema,
});

export const favouriteStatusSchema = favouriteReferenceSchema.extend({
  favourite: z.boolean(),
});

export const favouriteStatusListSchema = z.array(favouriteStatusSchema);
export const pagedFavouritesSchema = pagedLocationsSchema;

export type FavouriteReference = z.infer<typeof favouriteReferenceSchema>;
export type FavouriteStatus = z.infer<typeof favouriteStatusSchema>;
export type PagedFavourites = z.infer<typeof pagedFavouritesSchema>;
