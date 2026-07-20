import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { ServiceCentreAddressType } from '../../../main/schemas/serviceCentreAddressSchema';
import { ServiceCentreAddressService } from '../../../main/services/ServiceCentreAddressService';

describe('ServiceCentreAddressService', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';
  const addressId = '22222222-2222-4222-8222-222222222222';

  const buildAddress = (overrides: Record<string, unknown> = {}) => ({
    id: addressId,
    serviceCentreId,
    addressLine1: '1 High Street',
    addressLine2: null,
    townCity: 'London',
    county: null,
    postcode: 'SW1A 1AA',
    lat: null,
    lon: null,
    addressType: ServiceCentreAddressType.VISIT_US,
    ...overrides,
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('lists and retrieves addresses', async () => {
    const addresses = [buildAddress()];
    const getListSpy = jest
      .spyOn(DataApiRequests.prototype, 'getServiceCentreAddressDetails')
      .mockResolvedValue(addresses as never);
    const getByIdSpy = jest
      .spyOn(DataApiRequests.prototype, 'getServiceCentreAddressDetailsById')
      .mockResolvedValue(addresses[0] as never);

    const service = new ServiceCentreAddressService();

    await expect(service.list(serviceCentreId)).resolves.toEqual(addresses);
    await expect(service.retrieve(serviceCentreId, addressId)).resolves.toEqual(addresses[0]);
    expect(getListSpy).toHaveBeenCalledWith(serviceCentreId);
    expect(getByIdSpy).toHaveBeenCalledWith(serviceCentreId, addressId);
  });

  test('retrieveServiceCentreName returns name or status', async () => {
    jest
      .spyOn(DataApiRequests.prototype, 'getServiceCentreById')
      .mockResolvedValueOnce({ id: serviceCentreId, name: 'Reading Service Centre' } as never)
      .mockResolvedValueOnce(HttpStatusCode.NotFound);

    const service = new ServiceCentreAddressService();

    await expect(service.retrieveServiceCentreName(serviceCentreId)).resolves.toBe('Reading Service Centre');
    await expect(service.retrieveServiceCentreName(serviceCentreId)).resolves.toBe(HttpStatusCode.NotFound);
  });

  test('maps postcode search results and filters null DPA values', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getAddressesForPostcode').mockResolvedValue({
      results: [
        {
          DPA: {
            ADDRESS: '1 High Street, London, SW1A 1AA',
            BUILDING_NAME: null,
            BUILDING_NUMBER: '1',
            LAT: 51.501,
            LNG: -0.141,
            LOCAL_CUSTODIAN_CODE: null,
            LOCAL_CUSTODIAN_CODE_DESCRIPTION: null,
            ORGANISATION_NAME: null,
            POSTCODE: 'SW1A 1AA',
            POST_TOWN: 'London',
            THOROUGHFARE_NAME: 'High Street',
            UDPRN: null,
            UPRN: null,
          },
        },
        { DPA: null },
      ],
    } as never);

    const service = new ServiceCentreAddressService();
    const result = await service.retrieveAddressOptions('SW1A 1AA');

    expect(result).toEqual([
      expect.objectContaining({
        ADDRESS: '1 High Street, London, SW1A 1AA',
      }),
    ]);
  });

  test('retrieveAddressOptions returns invalid payload for map message and bad request fallback', async () => {
    const getAddressesForPostcode = jest
      .spyOn(DataApiRequests.prototype, 'getAddressesForPostcode')
      .mockResolvedValueOnce(new Map([['message', 'Postcode is invalid']]))
      .mockResolvedValueOnce(new Map([['postcode', 'BAD']]))
      .mockResolvedValueOnce(HttpStatusCode.InternalServerError);

    const service = new ServiceCentreAddressService();

    await expect(service.retrieveAddressOptions('BAD')).resolves.toEqual({
      status: 'invalid',
      error: 'Postcode is invalid',
    });
    await expect(service.retrieveAddressOptions('BAD')).resolves.toBe(HttpStatusCode.BadRequest);
    await expect(service.retrieveAddressOptions('BAD')).resolves.toBe(HttpStatusCode.InternalServerError);
    expect(getAddressesForPostcode).toHaveBeenCalledTimes(3);
  });

  test('save returns status when existing addresses cannot be loaded', async () => {
    jest
      .spyOn(DataApiRequests.prototype, 'getServiceCentreAddressDetails')
      .mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new ServiceCentreAddressService();
    const result = await service.save(buildAddress(), serviceCentreId);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('save returns local validation errors and does not call save apis', async () => {
    jest
      .spyOn(DataApiRequests.prototype, 'getServiceCentreAddressDetails')
      .mockResolvedValue([buildAddress()] as never);
    const getServiceCentreById = jest.spyOn(DataApiRequests.prototype, 'getServiceCentreById');
    const saveServiceCentreAddress = jest.spyOn(DataApiRequests.prototype, 'saveServiceCentreAddress');
    const updateServiceCentreAddress = jest.spyOn(DataApiRequests.prototype, 'updateServiceCentreAddress');

    const service = new ServiceCentreAddressService();
    const result = await service.save(
      {
        addressLine1: 'Invalid #',
        addressLine2: `${'A'.repeat(256)}#`,
        addressType: ServiceCentreAddressType.VISIT_US,
        county: `${'A'.repeat(256)}#`,
        postcode: 'bad',
        townCity: `${'A'.repeat(101)}#`,
      },
      serviceCentreId
    );

    expect(result).toEqual({
      status: 'invalid',
      address: expect.objectContaining({
        errors: expect.objectContaining({
          message: [
            'Only a single address can be added for a service centre, and this service centre already has an address assigned.',
          ],
          addressLine1: [
            "Address line 1 must only include letters a to z, and special characters '(',')',':',',','.' and '-'",
          ],
          addressLine2: [
            'Address line 2 must be 255 characters or less',
            "Address line 2 must only include letters a to z, and special characters '(',')',':',',','.' and '-'",
          ],
          county: [
            'County must be 255 characters or less',
            "County must only include letters a to z, and special characters '(',')',':',',','.' and '-'",
          ],
          postcode: ['Postcode format is invalid'],
          townCity: [
            'Town or city must be 100 characters or less',
            "Town or city must only include letters a to z, and special characters '(',')',':',',','.' and '-'",
          ],
        }),
      }),
    });

    expect(getServiceCentreById).not.toHaveBeenCalled();
    expect(saveServiceCentreAddress).not.toHaveBeenCalled();
    expect(updateServiceCentreAddress).not.toHaveBeenCalled();
  });

  test('save returns status when service centre lookup fails after validation', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getServiceCentreAddressDetails').mockResolvedValue([] as never);
    jest.spyOn(DataApiRequests.prototype, 'getServiceCentreById').mockResolvedValue(HttpStatusCode.NotFound);

    const service = new ServiceCentreAddressService();
    const result = await service.save(buildAddress({ id: null }), serviceCentreId);

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('save creates and updates addresses, and maps api validation errors', async () => {
    const regions = [{ country: 'england', id: '22222222-2222-4222-8222-222222222222', name: 'South East' }];
    const serviceAreas = [
      { id: '33333333-3333-4333-8333-333333333333', name: 'Money claims', nameCy: 'Money claims' },
      { id: '44444444-4444-4444-8444-444444444444', name: 'Probate', nameCy: 'Probate' },
    ];
    const newAddress = buildAddress({ id: null });
    const updatedAddress = buildAddress({ addressLine1: '2 High Street' });
    const serviceCentre = {
      createdAt: '2026-06-10T10:00:00Z',
      id: '11111111-1111-4111-8111-111111111111',
      lastUpdatedAt: '2026-06-10T10:00:00Z',
      name: 'Reading Service Centre',
      open: false,
      regionId: regions[0].id,
      serviceAreaIds: [serviceAreas[0].id],
      slug: 'reading-service-centre',
      warningNotice: null,
    };
    const updatedServiceCentre = {
      ...serviceCentre,
      open: true,
    };
    const saveServiceCentreAddress = jest
      .spyOn(DataApiRequests.prototype, 'saveServiceCentreAddress')
      .mockResolvedValueOnce(newAddress as never)
      .mockResolvedValueOnce(
        new Map([
          ['addressLine1', 'Address line 1 is too long'],
          ['Timestamp', 'ignore'],
        ]) as never
      )
      .mockResolvedValueOnce(HttpStatusCode.BadGateway);
    const updateServiceCentreAddress = jest
      .spyOn(DataApiRequests.prototype, 'updateServiceCentreAddress')
      .mockResolvedValue(updatedAddress as never);

    const updateServiceCentre = jest
      .spyOn(DataApiRequests.prototype, 'updateServiceCentre')
      .mockResolvedValue(updatedServiceCentre as never);

    jest.spyOn(DataApiRequests.prototype, 'getServiceCentreAddressDetails').mockResolvedValue([] as never);
    jest.spyOn(DataApiRequests.prototype, 'getServiceCentreById').mockResolvedValue(serviceCentre as never);

    const service = new ServiceCentreAddressService();

    await expect(service.save(newAddress, serviceCentreId, undefined, true)).resolves.toEqual({
      status: 'saved',
      address: newAddress,
      serviceCentreOpened: true,
      serviceCentreName: 'Reading Service Centre',
    });

    await expect(service.save(newAddress, serviceCentreId)).resolves.toEqual({
      status: 'invalid',
      address: {
        ...newAddress,
        errors: {
          addressLine1: ['Address line 1 is too long'],
        },
      },
    });

    await expect(service.save(newAddress, serviceCentreId)).resolves.toBe(HttpStatusCode.BadGateway);
    await expect(service.save(updatedAddress, serviceCentreId, addressId)).resolves.toEqual({
      status: 'saved',
      address: updatedAddress,
      serviceCentreOpened: false,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(saveServiceCentreAddress).toHaveBeenCalledWith(newAddress, serviceCentreId);
    expect(updateServiceCentreAddress).toHaveBeenCalledWith(updatedAddress, serviceCentreId, addressId);
    expect(updateServiceCentre).toHaveBeenCalledWith(updatedServiceCentre);
  });

  test('delete returns status for failed lookups and deletes when request succeeds', async () => {
    const deleteServiceCentreAddress = jest.spyOn(DataApiRequests.prototype, 'deleteServiceCentreAddress');
    jest
      .spyOn(DataApiRequests.prototype, 'getServiceCentreById')
      .mockResolvedValueOnce(HttpStatusCode.NotFound)
      .mockResolvedValue({ id: serviceCentreId, name: 'Reading Service Centre' } as never);
    const getServiceCentreAddressDetails = jest
      .spyOn(DataApiRequests.prototype, 'getServiceCentreAddressDetails')
      .mockResolvedValueOnce(HttpStatusCode.InternalServerError)
      .mockResolvedValueOnce([buildAddress({ id: '33333333-3333-4333-8333-333333333333' })] as never)
      .mockResolvedValueOnce([buildAddress()] as never)
      .mockResolvedValueOnce([buildAddress()] as never);
    deleteServiceCentreAddress
      .mockResolvedValueOnce(HttpStatusCode.InternalServerError)
      .mockResolvedValueOnce(HttpStatusCode.NoContent);

    const service = new ServiceCentreAddressService();

    await expect(service.delete(serviceCentreId, addressId)).resolves.toBe(HttpStatusCode.NotFound);
    await expect(service.delete(serviceCentreId, addressId)).resolves.toBe(HttpStatusCode.InternalServerError);
    await expect(service.delete(serviceCentreId, addressId)).resolves.toBe(HttpStatusCode.NotFound);
    await expect(service.delete(serviceCentreId, addressId)).resolves.toBe(HttpStatusCode.InternalServerError);
    await expect(service.delete(serviceCentreId, addressId)).resolves.toEqual({
      status: 'deleted',
      address: buildAddress(),
      serviceCentreName: 'Reading Service Centre',
    });

    expect(getServiceCentreAddressDetails).toHaveBeenCalledTimes(4);
  });
});
