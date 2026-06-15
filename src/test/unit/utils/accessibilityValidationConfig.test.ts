import { validate } from '../../../main/utils/accessibilityValidationConfig';

describe('accessibilityValidationConfig.validate', () => {
  test('returns required errors for missing core fields', () => {
    const result = validate({});

    expect(result).toEqual(
      expect.objectContaining({
        accessibleParking: ['Select whether accessible parking is available'],
        accessibleEntrance: ['Select whether an accessible entrance is available'],
        lift: ['Select whether a lift is available'],
        quietRoom: ['Select whether a quiet room is available'],
        accessibleToiletDescription: ['Enter a description of the accessible toilet facilities'],
        hearingEnhancementEquipment: ['Select what hearing enhancement equipment is available'],
      })
    );
  });

  test('requires lift dimensions when lift is true', () => {
    const result = validate({
      accessibleParking: true,
      accessibleEntrance: true,
      lift: true,
      quietRoom: true,
      accessibleToiletDescription: 'Ground floor',
      hearingEnhancementEquipment: 'infrared',
    });

    expect(result).toEqual(
      expect.objectContaining({
        liftDoorWidth: ['Enter the lift door width'],
        liftDoorLimit: ['Enter the lift door limit'],
      })
    );
  });

  test('validates invalid lift numeric fields', () => {
    const result = validate({
      accessibleParking: true,
      accessibleEntrance: true,
      lift: true,
      liftDoorWidth: Number.NaN,
      liftDoorLimit: Number.NaN,
      quietRoom: true,
      accessibleToiletDescription: 'Ground floor',
      hearingEnhancementEquipment: 'infraredAndHearingLoop',
    });

    expect(result).toEqual(
      expect.objectContaining({
        liftDoorWidth: ['Lift door width must be a valid number'],
        liftDoorLimit: ['Lift door limit must be a valid number'],
      })
    );
  });

  test('validates phone requirements and formats', () => {
    const result = validate({
      accessibleParking: true,
      accessibleParkingPhoneNumber: 'abc',
      accessibleEntrance: false,
      accessibleEntrancePhoneNumber: '',
      lift: false,
      quietRoom: true,
      accessibleToiletDescription: 'Ground floor',
      hearingEnhancementEquipment: 'hearingLoop',
    });

    expect(result).toEqual(
      expect.objectContaining({
        accessibleParkingPhoneNumber: ['Enter a valid phone number (10-20 digits, optional +44, spaces allowed)'],
        accessibleEntrancePhoneNumber: ['Enter a phone number for the accessible entrance'],
      })
    );
  });

  test('returns undefined when model is valid', () => {
    const result = validate({
      accessibleParking: true,
      accessibleParkingPhoneNumber: '01234567890',
      accessibleEntrance: false,
      accessibleEntrancePhoneNumber: '01234567891',
      lift: true,
      liftDoorWidth: 100,
      liftDoorLimit: 500,
      quietRoom: true,
      accessibleToiletDescription: 'Ground floor and first floor',
      hearingEnhancementEquipment: 'infrared',
    });

    expect(result).toBeUndefined();
  });
});
