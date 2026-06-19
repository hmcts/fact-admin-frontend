import { UpdateAccessibilityRequest } from '../requests/types/UpdateAccessibilityRequest';
import { HEARING_ENHANCEMENT_EQUIPMENT_MAP, HearingEnhancementEquipmentUi } from '../schemas/accessibilitySchema';
import { FOOD_DRINK_OPTIONS, FoodDrinkOption } from '../schemas/buildingFacilitiesSchema';
import { AccessibilityModel } from '../services/AccessibilityService';
import { FacilityModel } from '../services/BuildingFacilitiesService';
type FoodDrinkBooleans = Record<FoodDrinkOption, boolean | null>;

// Map the food and drink options to the expected boolean values for the API
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

type HearingEnhancementEquipment = NonNullable<AccessibilityModel['hearingEnhancementEquipment']>;

export const isHearingEnhancementEquipment = (value: unknown): value is HearingEnhancementEquipment => {
  return typeof value === 'string' && value in HEARING_ENHANCEMENT_EQUIPMENT_MAP;
};

export const mapHearingEnhancementEquipment = (
  value: AccessibilityModel['hearingEnhancementEquipment']
): UpdateAccessibilityRequest['hearingEnhancementEquipment'] | undefined => {
  if (!value || !isHearingEnhancementEquipment(value)) {
    return undefined;
  }

  return HEARING_ENHANCEMENT_EQUIPMENT_MAP[value as HearingEnhancementEquipmentUi];
};
