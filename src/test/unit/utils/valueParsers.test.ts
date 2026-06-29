import { addFoodAndDrink, mapFoodAndDrink, parseBoolean, toUkDateTimeString } from '../../../main/utils/valueParsers';

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

  describe('toUkDateTimeString', () => {
    test('converts a UTC winter timestamp to UK local time with milliseconds', () => {
      expect(toUkDateTimeString('2024-01-15T12:34:56.789Z')).toBe('15/01/2024 12:34:56.789');
    });

    test('converts a UTC summer timestamp to UK local time applying daylight savings offset', () => {
      expect(toUkDateTimeString('2024-07-15T12:34:56.789Z')).toBe('15/07/2024 13:34:56.789');
    });

    test('returns the original value when input is not a valid ISO-8601 datetime', () => {
      expect(toUkDateTimeString('not-a-date')).toBe('not-a-date');
    });

    test('returns the original value when input is an impossible ISO date', () => {
      expect(toUkDateTimeString('2024-02-30T10:00:00.000Z')).toBe('2024-02-30T10:00:00.000Z');
    });

    test('formats output using a provided custom format', () => {
      expect(toUkDateTimeString('2024-03-01T00:00:00.123Z', 'YYYY-MM-DD HH:mm:ss')).toBe('2024-03-01 00:00:00');
    });

    test('accepts ISO-8601 UTC offset input and converts it to UK local time', () => {
      expect(toUkDateTimeString('2024-03-01T01:00:00.000+01:00')).toBe('01/03/2024 00:00:00.000');
    });
  });
});
