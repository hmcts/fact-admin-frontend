import { FOOD_DRINK_OPTIONS, FoodDrinkOption } from '../schemas/buildingFacilitiesSchema';
import { FacilityModel } from '../services/BuildingFacilitiesService';
/**
 * Parses an integer-like value, falling back when the value is invalid.
 */
export function parseNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

/**
 * Parses a required string-like value, returning an empty string when absent.
 */
export function parseString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Parses an optional string-like value.
 */
export function parseOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/**
 * Checks whether a value is a UUID in the format expected by the API.
 */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

type FoodDrinkBooleans = Record<FoodDrinkOption, boolean | null>;

export const mapFoodAndDrink = (
  foodAndDrink: FoodDrinkOption | FoodDrinkOption[] | null | undefined
): FoodDrinkBooleans => {
  const list = Array.isArray(foodAndDrink) ? foodAndDrink : foodAndDrink ? [foodAndDrink] : [];
  const selected = new Set(list);
  return FOOD_DRINK_OPTIONS.reduce(
    (result, option) => ({
      ...result,
      [option]: selected.has(option),
    }),
    {} as FoodDrinkBooleans
  );
};

export const addFoodAndDrink = (data: FacilityModel): FacilityModel => {
  const foodAndDrink = FOOD_DRINK_OPTIONS.filter(key => data[key] === true);

  return {
    ...data,
    foodAndDrink,
  };
};
/**
 * converts a string into a slug format (code is mirrored from the data api).
 *
 * @param name The court name
 */
export function toSlugFormat(name: string): string {
  return name
    .toLowerCase()
    .replaceAll(/[^a-z\s-]/g, '')
    .replaceAll(/[\s-]+/g, '-')
    .replaceAll(/(^-)|(-$)/g, '');
}
