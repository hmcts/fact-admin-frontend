import { z } from 'zod';

export enum FoodDrinkEnum {
  freeWaterDispensers = 'freeWaterDispensers',
  snackVendingMachines = 'snackVendingMachines',
  drinkVendingMachines = 'drinkVendingMachines',
  cafeteria = 'cafeteria',
}

export const FOOD_DRINK_OPTIONS = [
  FoodDrinkEnum.freeWaterDispensers,
  FoodDrinkEnum.snackVendingMachines,
  FoodDrinkEnum.drinkVendingMachines,
  FoodDrinkEnum.cafeteria,
] as const;

export const FoodDrinkZodEnum = z.enum(FOOD_DRINK_OPTIONS);
export type FoodDrinkOption = `${FoodDrinkEnum}`;

export const BuildingFacilitiesSchema = z
  .object({
    id: z.string(),
    courtId: z.string(),
    parking: z.boolean().optional(),
    freeWaterDispensers: z.boolean().nullable().optional(),
    snackVendingMachines: z.boolean().nullable(),
    drinkVendingMachines: z.boolean().nullable(),
    cafeteria: z.boolean().nullable(),
    waitingArea: z.boolean().optional(),
    waitingAreaChildren: z.boolean().optional().nullable(),
    quietRoom: z.boolean().optional(),
    babyChanging: z.boolean().optional(),
    wifi: z.boolean().optional(),
    foodAndDrink: z.array(FoodDrinkZodEnum).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.waitingArea === true && data.waitingAreaChildren === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['waitingAreaChildren'],
        message: 'Select whether the children waiting area is available',
      });
    }
  });

export type BuildingFacilities = z.infer<typeof BuildingFacilitiesSchema>;
