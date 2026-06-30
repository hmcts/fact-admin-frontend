import {
  addFoodAndDrink,
  isHearingEnhancementEquipment,
  mapFoodAndDrink,
  mapHearingEnhancementEquipment,
} from '../../../main/utils/mapper';

describe('mapper', () => {
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

  describe('hearing enhancement mapping', () => {
    test('validates accepted hearing enhancement values', () => {
      expect(isHearingEnhancementEquipment('infraredAndHearingLoop')).toBe(true);
      expect(isHearingEnhancementEquipment('infrared')).toBe(true);
      expect(isHearingEnhancementEquipment('hearingLoop')).toBe(true);
      expect(isHearingEnhancementEquipment('bad-value')).toBe(false);
    });

    test('maps UI hearing values to API values', () => {
      expect(mapHearingEnhancementEquipment('infraredAndHearingLoop')).toBe(
        'INFRARED_SYSTEMS_AND_HEARING_LOOP_SYSTEMS'
      );
      expect(mapHearingEnhancementEquipment('infrared')).toBe('INFRARED_SYSTEMS');
      expect(mapHearingEnhancementEquipment('hearingLoop')).toBe('HEARING_LOOP_SYSTEMS');
      expect(mapHearingEnhancementEquipment(undefined)).toBeUndefined();
    });
  });
});
