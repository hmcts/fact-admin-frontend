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

  test('lists opening hour types', async () => {
    const openingHourTypes = [{ id: '11111111-1111-4111-8111-111111111111', name: 'Court open', nameCy: null }];
    jest.spyOn(DataApiRequests.prototype, 'getOpeningHourTypes').mockResolvedValue(openingHourTypes as never);

    const service = new TypesService();
    const result = await service.listOpeningHourTypes();

    expect(result).toEqual(openingHourTypes);
    expect(DataApiRequests.prototype.getOpeningHourTypes).toHaveBeenCalledTimes(1);
  });

  test('returns status code when listing opening hour types fails', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getOpeningHourTypes').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new TypesService();
    const result = await service.listOpeningHourTypes();

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('lists local authorities', async () => {
    const localAuthorities = [{ id: '11111111-1111-4111-8111-111111111111', name: 'Reading' }];
    jest.spyOn(DataApiRequests.prototype, 'getLocalAuthorities').mockResolvedValue(localAuthorities as never);

    const service = new TypesService();
    const result = await service.listLocalAuthorities();

    expect(result).toEqual(localAuthorities);
    expect(DataApiRequests.prototype.getLocalAuthorities).toHaveBeenCalledTimes(1);
  });

  test('returns status code when listing local authorities fails', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getLocalAuthorities').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new TypesService();
    const result = await service.listLocalAuthorities();

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });
});
