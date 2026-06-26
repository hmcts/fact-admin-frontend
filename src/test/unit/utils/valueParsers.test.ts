import {
  addFoodAndDrink,
  mapFoodAndDrink,
  parseBoolean,
  parseOptionalString,
  parseString,
} from '../../../main/utils/valueParsers';

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

  describe('parseString', () => {
    test('returns string values directly', () => {
      expect(parseString('court-id')).toBe('court-id');
    });

    test('returns the first string when value is an array', () => {
      expect(parseString(['first', 'second'])).toBe('first');
    });

    test('returns an empty string when no string value is available', () => {
      expect(parseString(undefined)).toBe('');
      expect(parseString([1, false])).toBe('');
    });
  });

  describe('parseOptionalString', () => {
    test('returns string values directly', () => {
      expect(parseOptionalString('yes')).toBe('yes');
    });

    test('returns the first string when value is an array', () => {
      expect(parseOptionalString([1, 'yes', 'no'])).toBe('yes');
    });

    test('returns undefined when no string value is available', () => {
      expect(parseOptionalString(undefined)).toBeUndefined();
      expect(parseOptionalString([1, false])).toBeUndefined();
    });
  });
});
