import { HttpStatusCode } from 'axios';

import { CourtEntity } from '../../../main/schemas/courtEntitySchema';
import { Region } from '../../../main/schemas/regionSchema';
import { GeneralService } from '../../../main/services/GeneralService';

describe('GeneralService', () => {
  const courtEntity = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Reading Crown Court',
    open: true,
    regionId: '22222222-2222-4222-8222-222222222222',
  } as CourtEntity;

  const regions = [
    {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'South East',
    },
  ] as Region[];

  test('retrieve returns the court with regions when both API calls succeed', async () => {
    const requests = {
      getCourtById: jest.fn().mockResolvedValue(courtEntity),
      getRegions: jest.fn().mockResolvedValue(regions),
    };

    const service = new GeneralService(requests as never);

    await expect(service.retrieve(courtEntity.id)).resolves.toEqual({ ...courtEntity, regions });
    expect(requests.getCourtById).toHaveBeenCalledWith(courtEntity.id);
    expect(requests.getRegions).toHaveBeenCalled();
  });

  test('retrieve returns a status code when the court lookup fails', async () => {
    const requests = {
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getRegions: jest.fn(),
    };

    const service = new GeneralService(requests as never);

    await expect(service.retrieve(courtEntity.id)).resolves.toBe(HttpStatusCode.NotFound);
    expect(requests.getRegions).not.toHaveBeenCalled();
  });

  test('retrieve returns a status code when region lookup fails', async () => {
    const requests = {
      getCourtById: jest.fn().mockResolvedValue(courtEntity),
      getRegions: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    };

    const service = new GeneralService(requests as never);

    await expect(service.retrieve(courtEntity.id)).resolves.toBe(HttpStatusCode.InternalServerError);
  });

  test('save returns validation errors merged into the retrieved model', async () => {
    const requests = {
      getCourtById: jest.fn().mockResolvedValue(courtEntity),
      getRegions: jest.fn().mockResolvedValue(regions),
      updateCourt: jest.fn(),
    };

    const service = new GeneralService(requests as never);

    const result = await service.save({
      id: courtEntity.id,
      name: '',
      regionId: '',
      open: undefined,
    });

    expect(result).toEqual({
      ...courtEntity,
      regions,
      errors: {
        name: ['Enter a name for the court'],
        open: ['Select whether the court is open or closed'],
        regionId: ['Select a region for the court'],
      },
    });
    expect(requests.updateCourt).not.toHaveBeenCalled();
  });

  test('save returns validation errors for invalid court name content', async () => {
    const requests = {
      getCourtById: jest.fn().mockResolvedValue(courtEntity),
      getRegions: jest.fn().mockResolvedValue(regions),
      updateCourt: jest.fn(),
    };

    const service = new GeneralService(requests as never);

    const result = await service.save({
      id: courtEntity.id,
      name: 'Court #1',
      regionId: courtEntity.regionId,
      open: true,
    });

    expect(result).toEqual({
      ...courtEntity,
      regions,
      errors: {
        name: ['Court name must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses'],
      },
    });
    expect(requests.updateCourt).not.toHaveBeenCalled();
  });

  test('save returns upstream status code when retrieving fails', async () => {
    const requests = {
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      getRegions: jest.fn(),
      updateCourt: jest.fn(),
    };

    const service = new GeneralService(requests as never);

    await expect(
      service.save({
        id: courtEntity.id,
        name: 'Reading Crown Court',
        open: true,
        regionId: courtEntity.regionId,
      })
    ).resolves.toBe(HttpStatusCode.NotFound);

    expect(requests.updateCourt).not.toHaveBeenCalled();
  });

  test('save persists merged changes and returns the updated court entity', async () => {
    const requests = {
      getCourtById: jest.fn().mockResolvedValue({ ...courtEntity, updatedAt: '2026-01-01T00:00:00Z' }),
      getRegions: jest.fn().mockResolvedValue(regions),
      updateCourt: jest.fn().mockResolvedValue({
        ...courtEntity,
        name: 'Updated Court Name',
        open: false,
      }),
    };

    const service = new GeneralService(requests as never);

    const result = await service.save({
      id: courtEntity.id,
      name: 'Updated Court Name',
      open: false,
      regionId: '33333333-3333-4333-8333-333333333333',
    });

    expect(requests.updateCourt).toHaveBeenCalledWith({
      ...courtEntity,
      updatedAt: '2026-01-01T00:00:00Z',
      regions,
      name: 'Updated Court Name',
      open: false,
      regionId: '33333333-3333-4333-8333-333333333333',
    });
    expect(result).toEqual({
      ...courtEntity,
      name: 'Updated Court Name',
      open: false,
    });
  });

  test('save returns status code when updateCourt fails', async () => {
    const requests = {
      getCourtById: jest.fn().mockResolvedValue(courtEntity),
      getRegions: jest.fn().mockResolvedValue(regions),
      updateCourt: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    };

    const service = new GeneralService(requests as never);

    await expect(
      service.save({
        id: courtEntity.id,
        name: 'Updated Court Name',
        open: false,
        regionId: courtEntity.regionId,
      })
    ).resolves.toBe(HttpStatusCode.InternalServerError);
  });

  test('save maps API validation errors into the view model error format', async () => {
    const requests = {
      getCourtById: jest.fn().mockResolvedValue(courtEntity),
      getRegions: jest.fn().mockResolvedValue(regions),
      updateCourt: jest.fn().mockResolvedValue(
        new Map<string, string>([
          ['name', 'Name already exists'],
          ['regionId', 'Invalid region'],
        ])
      ),
    };

    const service = new GeneralService(requests as never);

    const result = await service.save({
      id: courtEntity.id,
      name: 'Updated Court Name',
      open: true,
      regionId: courtEntity.regionId,
    });

    expect(result).toEqual({
      ...courtEntity,
      regions,
      name: 'Updated Court Name',
      open: true,
      errors: {
        name: ['Name already exists'],
        regionId: ['Invalid region'],
      },
    });
  });
});
