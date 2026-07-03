import { HttpStatusCode } from 'axios';

import { AccessibilityService } from '../../../main/services/AccessibilityService';

jest.mock('../../../main/utils/accessibilityValidationConfig', () => ({
  validate: jest.fn(),
}));

jest.mock('../../../main/utils/mapper', () => ({
  mapHearingEnhancementEquipment: jest.fn(),
}));

const { validate } = jest.requireMock('../../../main/utils/accessibilityValidationConfig') as {
  validate: jest.Mock;
};

const { mapHearingEnhancementEquipment } = jest.requireMock('../../../main/utils/mapper') as {
  mapHearingEnhancementEquipment: jest.Mock;
};

describe('AccessibilityService', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retrieve returns status when court lookup fails', async () => {
    const service = new AccessibilityService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      getAccessibility: jest.fn(),
    } as never);

    const result = await service.retrieve(courtId);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('retrieve returns status when accessibility lookup fails', async () => {
    const service = new AccessibilityService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Court A' }),
      getAccessibility: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    } as never);

    const result = await service.retrieve(courtId);

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('retrieve returns merged model when successful', async () => {
    const service = new AccessibilityService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Court A' }),
      getAccessibility: jest.fn().mockResolvedValue({ courtId, accessibleParking: true }),
    } as never);

    const result = await service.retrieve(courtId);

    expect(result).toEqual({ courtId, accessibleParking: true, name: 'Court A' });
  });

  test('save returns validation errors when validation fails', async () => {
    validate.mockReturnValueOnce({ quietRoom: ['Select whether a quiet room is available'] });

    const updateAccessibility = jest.fn();
    const service = new AccessibilityService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Court A' }),
      updateAccessibility,
    } as never);

    const model = { courtId, quietRoom: undefined };
    const result = await service.save(courtId, model);

    expect(result).toEqual({
      ...model,
      name: 'Court A',
      errors: { quietRoom: ['Select whether a quiet room is available'] },
    });
    expect(updateAccessibility).not.toHaveBeenCalled();
  });

  test('save maps hearing equipment before update', async () => {
    validate.mockReturnValueOnce(undefined);
    mapHearingEnhancementEquipment.mockReturnValueOnce('INFRARED_SYSTEMS');

    const updateAccessibility = jest.fn().mockResolvedValue({ id: 'acc-1', courtId, quietRoom: true });
    const service = new AccessibilityService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Court A' }),
      updateAccessibility,
    } as never);

    const result = await service.save(courtId, {
      courtId,
      hearingEnhancementEquipment: 'infrared',
      quietRoom: true,
    });

    expect(mapHearingEnhancementEquipment).toHaveBeenCalledWith('infrared');
    expect(updateAccessibility).toHaveBeenCalledWith(
      courtId,
      expect.objectContaining({ hearingEnhancementEquipment: 'INFRARED_SYSTEMS' })
    );
    expect(result).toEqual({ id: 'acc-1', courtId, quietRoom: true, name: 'Court A' });
  });

  test('save returns status when court lookup fails', async () => {
    const service = new AccessibilityService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      updateAccessibility: jest.fn(),
    } as never);

    const result = await service.save(courtId, { courtId });

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('save returns numeric update status as-is', async () => {
    validate.mockReturnValueOnce(undefined);
    mapHearingEnhancementEquipment.mockReturnValueOnce(undefined);

    const service = new AccessibilityService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Court A' }),
      updateAccessibility: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    } as never);

    const result = await service.save(courtId, { courtId, quietRoom: true });

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('save returns transformed API map errors', async () => {
    validate.mockReturnValueOnce(undefined);
    mapHearingEnhancementEquipment.mockReturnValueOnce(undefined);

    const service = new AccessibilityService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Court A' }),
      updateAccessibility: jest.fn().mockResolvedValue(new Map([['liftDoorWidth', 'Invalid number']])),
    } as never);

    const result = await service.save(courtId, { courtId, lift: true });

    expect(result).toEqual({
      courtId,
      lift: true,
      name: 'Court A',
      errors: { liftDoorWidth: ['Invalid number'] },
    });
  });
});
