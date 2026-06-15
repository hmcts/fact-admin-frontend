import { HttpStatusCode } from 'axios';

import { BuildingFacilitiesService } from '../../../main/services/BuildingFacilitiesService';

describe('BuildingFacilitiesService', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';

  test('retrieve returns status when court lookup fails', async () => {
    const service = new BuildingFacilitiesService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      getBuildingFacilities: jest.fn(),
    } as never);

    const result = await service.retrieve(courtId);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('retrieve returns status when facilities lookup fails', async () => {
    const service = new BuildingFacilitiesService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      getBuildingFacilities: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    } as never);

    const result = await service.retrieve(courtId);

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('retrieve returns facility model merged with court name', async () => {
    const service = new BuildingFacilitiesService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      getBuildingFacilities: jest.fn().mockResolvedValue({
        courtId,
        waitingArea: true,
        waitingAreaChildren: true,
      }),
    } as never);

    const result = await service.retrieve(courtId);

    expect(result).toEqual({
      courtId,
      waitingArea: true,
      waitingAreaChildren: true,
      name: 'Reading Crown Court',
    });
  });

  test('save returns status when court lookup fails', async () => {
    const service = new BuildingFacilitiesService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      updateBuildingFacilities: jest.fn(),
    } as never);

    const result = await service.save(courtId, { courtId });

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('save returns validation errors when required fields are missing', async () => {
    const service = new BuildingFacilitiesService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      updateBuildingFacilities: jest.fn(),
    } as never);

    const result = await service.save(courtId, { courtId });

    expect(result).toEqual({
      courtId,
      errors: {
        parking: ['Select whether the parking is available'],
        waitingArea: ['Select whether the waiting area is available'],
        quietRoom: ['Select whether the quiet room is available'],
        babyChanging: ['Select whether the baby changing is available'],
        wifi: ['Select whether the wifi is available'],
      },
    });
  });

  test('save requires waitingAreaChildren when waitingArea is true', async () => {
    const updateBuildingFacilities = jest.fn();
    const service = new BuildingFacilitiesService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      updateBuildingFacilities,
    } as never);

    const result = await service.save(courtId, {
      courtId,
      parking: true,
      waitingArea: true,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
    });

    expect(result).toEqual({
      courtId,
      parking: true,
      waitingArea: true,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
      errors: {
        waitingAreaChildren: ['Select whether the children waiting area is available'],
      },
    });
    expect(updateBuildingFacilities).not.toHaveBeenCalled();
  });

  test('save requires waitingAreaChildren when waitingArea is submitted as true', async () => {
    const updateBuildingFacilities = jest.fn();
    const service = new BuildingFacilitiesService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      updateBuildingFacilities,
    } as never);

    const result = await service.save(courtId, {
      courtId,
      parking: true,
      waitingArea: true,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
    });

    expect(result).toEqual({
      courtId,
      parking: true,
      waitingArea: true,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
      errors: {
        waitingAreaChildren: ['Select whether the children waiting area is available'],
      },
    });
    expect(updateBuildingFacilities).not.toHaveBeenCalled();
  });

  test('save returns status code when update call fails', async () => {
    const service = new BuildingFacilitiesService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      updateBuildingFacilities: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    } as never);

    const result = await service.save(courtId, {
      courtId,
      parking: true,
      waitingArea: false,
      quietRoom: true,
      babyChanging: false,
      wifi: true,
    });

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('save converts API map errors into field error arrays', async () => {
    const service = new BuildingFacilitiesService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      updateBuildingFacilities: jest.fn().mockResolvedValue(new Map([['wifi', 'Invalid wifi value']])),
    } as never);

    const result = await service.save(courtId, {
      courtId,
      parking: true,
      waitingArea: false,
      quietRoom: true,
      babyChanging: false,
      wifi: true,
    });

    expect(result).toEqual({
      courtId,
      parking: true,
      waitingArea: false,
      quietRoom: true,
      babyChanging: false,
      wifi: true,
      name: 'Reading Crown Court',
      errors: {
        wifi: ['Invalid wifi value'],
      },
    });
  });

  test('save returns successful payload merged with court name', async () => {
    const service = new BuildingFacilitiesService({
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      updateBuildingFacilities: jest.fn().mockResolvedValue({
        id: 'fac-1',
        courtId,
        parking: true,
        waitingArea: true,
        waitingAreaChildren: true,
        quietRoom: false,
        babyChanging: false,
        wifi: true,
      }),
    } as never);

    const result = await service.save(courtId, {
      courtId,
      parking: true,
      waitingArea: true,
      waitingAreaChildren: true,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
    });

    expect(result).toEqual({
      id: 'fac-1',
      courtId,
      parking: true,
      waitingArea: true,
      waitingAreaChildren: true,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
      name: 'Reading Crown Court',
    });
  });
});
