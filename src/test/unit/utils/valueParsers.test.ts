import { addFoodAndDrink, mapFoodAndDrink } from '../../../main/utils/valueParsers';

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
});
