import { z } from 'zod';

const FoodDrinkEnum = z.enum(['freeWaterDispensers', 'snackVendingMachines', 'drinkVendingMachines', 'cafeteria']);

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
    foodAndDrink: z.array(FoodDrinkEnum).nullable().optional(),
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
