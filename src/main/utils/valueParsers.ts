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
  const parsed = parseOptionalString(value);

  return parsed ?? '';
}

/**
 * Parses an optional string-like value.
 */
export function parseOptionalString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find((entry): entry is string => typeof entry === 'string');
  }

  return undefined;
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
  const mapToArray = item => (item ? [item] : []);
  const list = Array.isArray(foodAndDrink) ? foodAndDrink : mapToArray(foodAndDrink);
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
export const parseBoolean = (value: unknown): boolean | undefined => {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
};
