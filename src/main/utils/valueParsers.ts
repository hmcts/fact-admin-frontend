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

export type FoodDrinkOption = 'freeWaterDispensers' | 'snackVendingMachines' | 'drinkVendingMachines' | 'cafeteria';

type FoodDrinkBooleans = {
  freeWaterDispensers: boolean | null;
  snackVendingMachines: boolean | null;
  drinkVendingMachines: boolean | null;
  cafeteria: boolean | null;
};

export const mapFoodAndDrink = (foodAndDrink: FoodDrinkOption[] | null | undefined): FoodDrinkBooleans => {
  const list = foodAndDrink ?? []; // fallback
  return {
    freeWaterDispensers: list.includes('freeWaterDispensers'),
    snackVendingMachines: list.includes('snackVendingMachines'),
    drinkVendingMachines: list.includes('drinkVendingMachines'),
    cafeteria: list.includes('cafeteria'),
  };
};

export const addFoodAndDrink = (data: FacilityModel): FacilityModel => {
  const foodAndDrink = (
    ['freeWaterDispensers', 'snackVendingMachines', 'drinkVendingMachines', 'cafeteria'] as FoodDrinkOption[]
  ).filter(key => data[key] === true);

  return {
    ...data,
    foodAndDrink,
  };
};
