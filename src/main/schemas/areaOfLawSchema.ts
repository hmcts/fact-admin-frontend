import { z } from 'zod';

export const areaOfLawTypeSchema = z.object({
  displayName: z.string().nullable().optional(),
  displayNameCy: z.string().nullable().optional(),
  externalLink: z.string().nullable().optional(),
  externalLinkCy: z.string().nullable().optional(),
  id: z.string().optional(),
  name: z.string(),
  nameCy: z.string(),
});

export type AreaOfLawType = z.infer<typeof areaOfLawTypeSchema>;

export const courtAreaOfLawSelectionSchema = z.object({
  areaOfLawType: areaOfLawTypeSchema,
  selected: z.boolean(),
});

export type CourtAreaOfLawSelection = z.infer<typeof courtAreaOfLawSelectionSchema>;

function parseAreaOfLawTypeStringKey(key: string): AreaOfLawType | null {
  const match = key.match(/^AreaOfLawType\((.*)\)$/s);

  if (!match) {
    return null;
  }

  const fieldText = match[1];
  const fieldMatches = fieldText.matchAll(/(\w+)=([\s\S]*?)(?=, \w+=|$)/g);
  const parsedFields = Object.fromEntries(
    Array.from(fieldMatches, ([, fieldName, fieldValue]) => [fieldName, fieldValue === 'null' ? null : fieldValue])
  );

  try {
    return areaOfLawTypeSchema.parse(parsedFields);
  } catch {
    return null;
  }
}

export function parseCourtAreasOfLawResponse(data: unknown): CourtAreaOfLawSelection[] {
  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).map(([key, value]) => {
      const areaOfLawType = parseAreaOfLawTypeStringKey(key);

      if (!areaOfLawType || typeof value !== 'boolean') {
        throw new Error('Invalid court areas of law response');
      }

      return {
        areaOfLawType,
        selected: value,
      };
    });
  }

  throw new Error('Invalid court areas of law response');
}

export const courtAreasOfLawUpdateSchema = z.object({
  areasOfLaw: z.array(z.string()),
  courtId: z.string(),
});

export type CourtAreasOfLawUpdate = z.infer<typeof courtAreasOfLawUpdateSchema>;
