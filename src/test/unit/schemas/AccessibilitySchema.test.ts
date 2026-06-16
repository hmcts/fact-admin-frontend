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

  test('accepts API hearing enhancement values and normalizes to UI values', () => {
    const result = AccessibilityScheme.parse({
      ...base,
      hearingEnhancementEquipment: 'INFRARED_SYSTEMS',
    });

    expect(result.hearingEnhancementEquipment).toBe('infrared');
  });

  test('sets default welsh description value when omitted', () => {
    const result = AccessibilityScheme.parse({ ...base });

    expect(result.accessibleToiletDescriptionCy).toBe('welsh not available yet');
  });

  test('normalizes null welsh description to the default value', () => {
    const result = AccessibilityScheme.parse({
      ...base,
      accessibleToiletDescriptionCy: null,
    });

    expect(result.accessibleToiletDescriptionCy).toBe('welsh not available yet');
  });
});
