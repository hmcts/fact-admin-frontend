import { HttpStatusCode } from 'axios';

import { LocationNameService } from '../../../../main/services/shared/LocationNameService';

describe('LocationNameService', () => {
  const court = { id: 'court-id', name: 'Existing court' };
  const serviceCentre = { id: 'service-centre-id', name: 'Existing service centre' };

  test('returns a matching court before querying service centres', async () => {
    const courtApi = { getCourtByName: jest.fn().mockResolvedValue(court) };
    const serviceCentreApi = { getServiceCentreByName: jest.fn() };
    const service = new LocationNameService(courtApi as never, serviceCentreApi as never);

    await expect(service.findDuplicate(court.name)).resolves.toEqual({ ...court, type: 'court' });
    expect(serviceCentreApi.getServiceCentreByName).not.toHaveBeenCalled();
  });

  test('returns a matching service centre after a court is not found', async () => {
    const courtApi = { getCourtByName: jest.fn().mockResolvedValue(HttpStatusCode.NotFound) };
    const serviceCentreApi = { getServiceCentreByName: jest.fn().mockResolvedValue(serviceCentre) };
    const service = new LocationNameService(courtApi as never, serviceCentreApi as never);

    await expect(service.findDuplicate(serviceCentre.name)).resolves.toEqual({
      ...serviceCentre,
      type: 'serviceCentre',
    });
  });

  test('excludes the current service centre', async () => {
    const courtApi = { getCourtByName: jest.fn().mockResolvedValue(HttpStatusCode.NotFound) };
    const serviceCentreApi = { getServiceCentreByName: jest.fn().mockResolvedValue(serviceCentre) };
    const service = new LocationNameService(courtApi as never, serviceCentreApi as never);

    await expect(
      service.findDuplicate(serviceCentre.name, { id: serviceCentre.id, type: 'serviceCentre' })
    ).resolves.toBe(HttpStatusCode.NotFound);
  });

  test('propagates non-not-found statuses', async () => {
    const courtApi = { getCourtByName: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError) };
    const serviceCentreApi = { getServiceCentreByName: jest.fn() };
    const service = new LocationNameService(courtApi as never, serviceCentreApi as never);

    await expect(service.findDuplicate('name')).resolves.toBe(HttpStatusCode.InternalServerError);
  });
});
