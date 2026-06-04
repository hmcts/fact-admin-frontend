import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { TypesService } from '../../../main/services/TypesService';

describe('TypesService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('lists areas of law', async () => {
    const areasOfLaw = [{ name: 'Divorce' }, { name: 'Probate' }];
    jest.spyOn(DataApiRequests.prototype, 'getAreasOfLaw').mockResolvedValue(areasOfLaw as never);

    const service = new TypesService();
    const result = await service.listAreasOfLaw();

    expect(result).toEqual(areasOfLaw);
    expect(DataApiRequests.prototype.getAreasOfLaw).toHaveBeenCalledTimes(1);
  });

  test('returns status code when listing areas of law fails', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getAreasOfLaw').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new TypesService();
    const result = await service.listAreasOfLaw();

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('lists court types', async () => {
    const courtTypes = [{ name: 'CROWN' }, { name: 'FAMILY' }];
    jest.spyOn(DataApiRequests.prototype, 'getCourtTypes').mockResolvedValue(courtTypes as never);

    const service = new TypesService();
    const result = await service.listCourtTypes();

    expect(result).toEqual(courtTypes);
    expect(DataApiRequests.prototype.getCourtTypes).toHaveBeenCalledTimes(1);
  });

  test('returns status code when listing court types fails', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getCourtTypes').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new TypesService();
    const result = await service.listCourtTypes();

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });
});
