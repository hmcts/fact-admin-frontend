import { BuildingFacilitiesSchema } from '../../../main/schemas/buildingFacilitiesSchema';

describe('BuildingFacilitiesSchema', () => {
  const basePayload = {
    id: 'fac-1',
    courtId: '11111111-1111-4111-8111-111111111111',
    snackVendingMachines: false,
    drinkVendingMachines: false,
    cafeteria: false,
  };

  test('parses a valid payload', () => {
    const parsed = BuildingFacilitiesSchema.parse({
      ...basePayload,
      waitingArea: true,
      waitingAreaChildren: true,
      parking: true,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
      foodAndDrink: ['cafeteria'],
    });

    expect(parsed.waitingArea).toBe(true);
    expect(parsed.waitingAreaChildren).toBe(true);
    expect(parsed.foodAndDrink).toEqual(['cafeteria']);
  });

  test('fails when waitingArea is true and waitingAreaChildren is null', () => {
    const result = BuildingFacilitiesSchema.safeParse({
      ...basePayload,
      waitingArea: true,
      waitingAreaChildren: null,
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error('Expected parse to fail for null children waiting area when waitingArea is true');
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Select whether the children waiting area is available',
          path: ['waitingAreaChildren'],
        }),
      ])
    );
  });

  test('allows waitingAreaChildren to be null when waitingArea is false', () => {
    const result = BuildingFacilitiesSchema.safeParse({
      ...basePayload,
      waitingArea: false,
      waitingAreaChildren: null,
    });

    expect(result.success).toBe(true);
  });
});
