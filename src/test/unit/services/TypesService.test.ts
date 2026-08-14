import { HttpStatusCode } from 'axios';

import { ReferenceDataApi } from '../../../main/requests/ReferenceDataApi';
import { TypesService } from '../../../main/services/TypesService';

describe('TypesService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('lists areas of law', async () => {
    const areasOfLaw = [{ name: 'Divorce' }, { name: 'Probate' }];
    jest.spyOn(ReferenceDataApi.prototype, 'getAreasOfLaw').mockResolvedValue(areasOfLaw as never);

    const service = new TypesService();
    const result = await service.listAreasOfLaw();

    expect(result).toEqual(areasOfLaw);
    expect(ReferenceDataApi.prototype.getAreasOfLaw).toHaveBeenCalledTimes(1);
  });

  test('returns status code when listing areas of law fails', async () => {
    jest.spyOn(ReferenceDataApi.prototype, 'getAreasOfLaw').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new TypesService();
    const result = await service.listAreasOfLaw();

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('lists court types', async () => {
    const courtTypes = [{ name: 'CROWN' }, { name: 'FAMILY' }];
    jest.spyOn(ReferenceDataApi.prototype, 'getCourtTypes').mockResolvedValue(courtTypes as never);

    const service = new TypesService();
    const result = await service.listCourtTypes();

    expect(result).toEqual(courtTypes);
    expect(ReferenceDataApi.prototype.getCourtTypes).toHaveBeenCalledTimes(1);
  });

  test('returns status code when listing court types fails', async () => {
    jest.spyOn(ReferenceDataApi.prototype, 'getCourtTypes').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new TypesService();
    const result = await service.listCourtTypes();

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('lists opening hour types', async () => {
    const openingHourTypes = [{ id: '11111111-1111-4111-8111-111111111111', name: 'Court open', nameCy: null }];
    jest.spyOn(ReferenceDataApi.prototype, 'getOpeningHourTypes').mockResolvedValue(openingHourTypes as never);

    const service = new TypesService();
    const result = await service.listOpeningHourTypes();

    expect(result).toEqual(openingHourTypes);
    expect(ReferenceDataApi.prototype.getOpeningHourTypes).toHaveBeenCalledTimes(1);
  });

  test('returns status code when listing opening hour types fails', async () => {
    jest.spyOn(ReferenceDataApi.prototype, 'getOpeningHourTypes').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new TypesService();
    const result = await service.listOpeningHourTypes();

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('lists local authorities', async () => {
    const localAuthorities = [{ id: '11111111-1111-4111-8111-111111111111', name: 'Reading' }];
    jest.spyOn(ReferenceDataApi.prototype, 'getLocalAuthorities').mockResolvedValue(localAuthorities as never);

    const service = new TypesService();
    const result = await service.listLocalAuthorities();

    expect(result).toEqual(localAuthorities);
    expect(ReferenceDataApi.prototype.getLocalAuthorities).toHaveBeenCalledTimes(1);
  });

  test('returns status code when listing local authorities fails', async () => {
    jest.spyOn(ReferenceDataApi.prototype, 'getLocalAuthorities').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new TypesService();
    const result = await service.listLocalAuthorities();

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });
});
