import { AccessibilityScheme } from '../../../main/schemas/accessibilitySchema';

describe('AccessibilityScheme', () => {
  const base = {
    id: 'acc-1',
    courtId: '11111111-1111-4111-8111-111111111111',
  };

  test('accepts UI hearing enhancement values', () => {
    const result = AccessibilityScheme.parse({
      ...base,
      hearingEnhancementEquipment: 'infraredAndHearingLoop',
    });

    expect(result.hearingEnhancementEquipment).toBe('infraredAndHearingLoop');
  });

  test('accepts none as a UI hearing enhancement value', () => {
    const result = AccessibilityScheme.parse({
      ...base,
      hearingEnhancementEquipment: 'none',
    });

    expect(result.hearingEnhancementEquipment).toBe('none');
  });

  test('accepts API hearing enhancement values and normalizes to UI values', () => {
    const result = AccessibilityScheme.parse({
      ...base,
      hearingEnhancementEquipment: 'INFRARED_SYSTEMS',
    });

    expect(result.hearingEnhancementEquipment).toBe('infrared');
  });

  test('normalizes the NONE API hearing enhancement value', () => {
    const result = AccessibilityScheme.parse({
      ...base,
      hearingEnhancementEquipment: 'NONE',
    });

    expect(result.hearingEnhancementEquipment).toBe('none');
  });

  test('keeps welsh description undefined when omitted', () => {
    const result = AccessibilityScheme.parse({ ...base });

    expect(result.accessibleToiletDescriptionCy).toBeUndefined();
  });

  test('accepts null toilet description values returned by the API', () => {
    const result = AccessibilityScheme.parse({
      ...base,
      accessibleToiletDescription: null,
      accessibleToiletDescriptionCy: null,
    });

    expect(result.accessibleToiletDescription).toBeNull();
    expect(result.accessibleToiletDescriptionCy).toBeNull();
  });
  test('normalizes null for accessibleParkingPhoneNumber', () => {
    const result = AccessibilityScheme.parse({
      ...base,
      accessibleParkingPhoneNumber: null,
    });

    expect(result.accessibleParkingPhoneNumber).toBe(null);
  });
});
