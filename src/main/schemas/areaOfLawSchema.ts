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

const AREA_OF_LAW_TYPE_PREFIX = 'AreaOfLawType(';
const AREA_OF_LAW_TYPE_SUFFIX = ')';
const AREA_OF_LAW_TYPE_FIELDS = [
  'id',
  'name',
  'nameCy',
  'externalLink',
  'externalLinkCy',
  'displayName',
  'displayNameCy',
] as const;

function findNextFieldDelimiterIndex(fieldText: string, valueStartIndex: number): number {
  return AREA_OF_LAW_TYPE_FIELDS.reduce((earliestIndex, fieldName) => {
    const delimiterIndex = fieldText.indexOf(`, ${fieldName}=`, valueStartIndex);

    return delimiterIndex !== -1 && (earliestIndex === -1 || delimiterIndex < earliestIndex)
      ? delimiterIndex
      : earliestIndex;
  }, -1);
}

function parseAreaOfLawTypeStringKey(key: string): AreaOfLawType | null {
  if (!key.startsWith(AREA_OF_LAW_TYPE_PREFIX) || !key.endsWith(AREA_OF_LAW_TYPE_SUFFIX)) {
    return null;
  }

  const fieldText = key.slice(AREA_OF_LAW_TYPE_PREFIX.length, -AREA_OF_LAW_TYPE_SUFFIX.length);
  const parsedFields: Record<string, string | null> = {};
  let fieldStartIndex = 0;

  while (fieldStartIndex < fieldText.length) {
    const equalsIndex = fieldText.indexOf('=', fieldStartIndex);

    if (equalsIndex === -1) {
      return null;
    }

    const fieldName = fieldText.slice(fieldStartIndex, equalsIndex);

    if (!AREA_OF_LAW_TYPE_FIELDS.includes(fieldName as (typeof AREA_OF_LAW_TYPE_FIELDS)[number])) {
      return null;
    }

    const valueStartIndex = equalsIndex + 1;
    const nextDelimiterIndex = findNextFieldDelimiterIndex(fieldText, valueStartIndex);
    const valueEndIndex = nextDelimiterIndex === -1 ? fieldText.length : nextDelimiterIndex;
    const fieldValue = fieldText.slice(valueStartIndex, valueEndIndex);

    parsedFields[fieldName] = fieldValue === 'null' ? null : fieldValue;

    if (nextDelimiterIndex === -1) {
      break;
    }

    fieldStartIndex = nextDelimiterIndex + 2;
  }

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
