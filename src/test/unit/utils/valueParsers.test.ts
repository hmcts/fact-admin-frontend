import { addFoodAndDrink, mapFoodAndDrink, parseBoolean } from '../../../main/utils/valueParsers';

describe('valueParsers', () => {
  describe('mapFoodAndDrink', () => {
    test('returns all false when value is undefined', () => {
      expect(mapFoodAndDrink(undefined)).toEqual({
        freeWaterDispensers: false,
        snackVendingMachines: false,
        drinkVendingMachines: false,
        cafeteria: false,
      });
    });

    test('returns all false when value is null', () => {
      expect(mapFoodAndDrink(null)).toEqual({
        freeWaterDispensers: false,
        snackVendingMachines: false,
        drinkVendingMachines: false,
        cafeteria: false,
      });
    });

    test('maps selected food and drink options to true', () => {
      expect(mapFoodAndDrink(['freeWaterDispensers', 'cafeteria'])).toEqual({
        freeWaterDispensers: true,
        snackVendingMachines: false,
        drinkVendingMachines: false,
        cafeteria: true,
      });
    });

    test('maps a single selected option when posted as a scalar value', () => {
      expect(mapFoodAndDrink('cafeteria')).toEqual({
        freeWaterDispensers: false,
        snackVendingMachines: false,
        drinkVendingMachines: false,
        cafeteria: true,
      });
    });
  });

  describe('addFoodAndDrink', () => {
    test('adds only true food and drink keys to model', () => {
      const result = addFoodAndDrink({
        freeWaterDispensers: true,
        snackVendingMachines: false,
        drinkVendingMachines: null,
        cafeteria: true,
      });

      expect(result).toEqual({
        freeWaterDispensers: true,
        snackVendingMachines: false,
        drinkVendingMachines: null,
        cafeteria: true,
        foodAndDrink: ['freeWaterDispensers', 'cafeteria'],
      });
    });

    test('adds empty list when no food and drink options are true', () => {
      const result = addFoodAndDrink({
        snackVendingMachines: false,
        drinkVendingMachines: false,
        cafeteria: false,
      });

      expect(result.foodAndDrink).toEqual([]);
    });
  });

  describe('parseBoolean', () => {
    test('returns true for boolean true and string "true"', () => {
      expect(parseBoolean(true)).toBe(true);
      expect(parseBoolean('true')).toBe(true);
    });

    test('returns false for boolean false and string "false"', () => {
      expect(parseBoolean(false)).toBe(false);
      expect(parseBoolean('false')).toBe(false);
    });

    test('returns undefined for unsupported values', () => {
      expect(parseBoolean('TRUE')).toBeUndefined();
      expect(parseBoolean('yes')).toBeUndefined();
      expect(parseBoolean(1)).toBeUndefined();
      expect(parseBoolean(undefined)).toBeUndefined();
      expect(parseBoolean(null)).toBeUndefined();
    });
  });
});
