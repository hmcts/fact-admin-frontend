import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { CourtAddress, CourtAddressType } from '../../../main/schemas/courtAddressSchema';
import { CourtAddressService, POSTCODE_ERROR_MESSAGES } from '../../../main/services/CourtAddressService';

describe('CourtAddressService', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const addressId = '22222222-2222-4222-8222-222222222222';

  const buildAddress = (overrides: Partial<CourtAddress> = {}): CourtAddress => ({
    id: addressId,
    courtId,
    addressLine1: '1 High Street',
    addressLine2: null,
    townCity: 'London',
    county: null,
    postcode: 'SW1A 1AA',
    epimId: null,
    lat: null,
    lon: null,
    addressType: CourtAddressType.VISIT_US,
    areasOfLaw: ['00000000-0000-4000-8000-000000000000'],
    courtTypes: ['00000000-0000-4000-8000-000000000000'],
    ...overrides,
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('lists addresses for a court', async () => {
    const addresses = [buildAddress()];
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue(addresses);

    const service = new CourtAddressService();
    const result = await service.list(courtId);

    expect(result).toEqual(addresses);
    expect(DataApiRequests.prototype.getCourtAddressDetails).toHaveBeenCalledWith(courtId);
  });

  test('retrieves a single address for a court', async () => {
    const address = buildAddress();
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetailsById').mockResolvedValue(address);

    const service = new CourtAddressService();
    const result = await service.retrieve(courtId, addressId);

    expect(result).toEqual(address);
    expect(DataApiRequests.prototype.getCourtAddressDetailsById).toHaveBeenCalledWith(courtId, addressId);
  });

  test('maps postcode search result DPA entries and removes null values', async () => {
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

    const service = new CourtAddressService();
    const result = await service.retrieveAddressOptions('SW1A 1AA');

    expect(result).toEqual([
      expect.objectContaining({
        ADDRESS: '1 High Street, London, SW1A 1AA',
      }),
    ]);
  });

  test('returns invalid response when postcode search API returns a message map', async () => {
    jest
      .spyOn(DataApiRequests.prototype, 'getAddressesForPostcode')
      .mockResolvedValue(new Map([['message', 'Postcode is invalid']]));

    const service = new CourtAddressService();
    const result = await service.retrieveAddressOptions('BAD');

    expect(result).toEqual({ status: 'invalid', error: 'Postcode is invalid' });
  });

  test('returns bad request when postcode search API returns map without message', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getAddressesForPostcode').mockResolvedValue(new Map([['postcode', 'BAD']]));

    const service = new CourtAddressService();
    const result = await service.retrieveAddressOptions('BAD');

    expect(result).toBe(HttpStatusCode.BadRequest);
  });

  test('returns invalid response from local validation and does not call save API', async () => {
    const getCourtAddressDetails = jest
      .spyOn(DataApiRequests.prototype, 'getCourtAddressDetails')
      .mockResolvedValue([buildAddress()]);
    const getCourtById = jest.spyOn(DataApiRequests.prototype, 'getCourtById');
    const saveCourtAddress = jest.spyOn(DataApiRequests.prototype, 'saveCourtAddress');

    const service = new CourtAddressService();
    const result = await service.save(
      {
        addressLine1: '',
        addressType: CourtAddressType.VISIT_US,
        postcode: '',
        townCity: '',
      },
      courtId,
      true,
      true
    );

    expect(getCourtAddressDetails).toHaveBeenCalledWith(courtId);
    expect(getCourtById).not.toHaveBeenCalled();
    expect(saveCourtAddress).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'invalid',
      address: expect.objectContaining({
        errors: expect.objectContaining({
          addressType: [
            'A court can only have one listed address for visiting and this court already has one.  Please edit the other visit address first.',
          ],
          addressLine1: ['Enter address line 1, typically the building and street'],
          postcode: ['Enter a postcode'],
          townCity: ['Enter a town or city'],
          areasOfLaw: ['Please select between 1 and 5 areas of law that this address is relevant for'],
          courtTypes: ['Please select at least one court type that this address is relevant for'],
        }),
      }),
    });
  });

  test('returns status code when loading existing addresses fails during save', async () => {
    jest
      .spyOn(DataApiRequests.prototype, 'getCourtAddressDetails')
      .mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new CourtAddressService();
    const result = await service.save(buildAddress(), courtId, false, false);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('returns status code when loading court fails during save', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([]);
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(HttpStatusCode.NotFound);

    const service = new CourtAddressService();
    const result = await service.save(buildAddress({ id: null }), courtId, false, false);

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('returns API validation errors as field errors when save fails with validation map', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([]);
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue({ name: 'Reading Crown Court' } as never);
    jest
      .spyOn(DataApiRequests.prototype, 'saveCourtAddress')
      .mockResolvedValue(new Map([['addressLine1', 'Address line 1 is too long']]));

    const service = new CourtAddressService();
    const address = buildAddress({ id: null });
    const result = await service.save(address, courtId, false, false);

    expect(result).toEqual({
      status: 'invalid',
      address: {
        ...address,
        errors: {
          addressLine1: ['Address line 1 is too long'],
        },
      },
    });
  });

  test('updates an existing address when addressId is provided', async () => {
    const existingAddress = buildAddress();
    const updatedAddress = buildAddress({ addressLine1: '2 High Street' });
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([existingAddress]);
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue({ name: 'Reading Crown Court' } as never);
    const updateCourtAddress = jest
      .spyOn(DataApiRequests.prototype, 'updateCourtAddress')
      .mockResolvedValue(updatedAddress);
    const saveCourtAddress = jest.spyOn(DataApiRequests.prototype, 'saveCourtAddress');

    const service = new CourtAddressService();
    const result = await service.save(
      {
        ...updatedAddress,
        addressType: CourtAddressType.WRITE_TO_US,
      },
      courtId,
      false,
      false,
      addressId
    );

    expect(updateCourtAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        addressLine1: '2 High Street',
      }),
      courtId,
      addressId
    );
    expect(saveCourtAddress).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'saved',
      courtName: 'Reading Crown Court',
      address: updatedAddress,
    });
  });

  test('deletes an address and returns deleted payload when API deletion succeeds', async () => {
    const address = buildAddress();
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue({ name: 'Reading Crown Court' } as never);
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetailsById').mockResolvedValue(address);
    jest.spyOn(DataApiRequests.prototype, 'deleteCourtAddress').mockResolvedValue(HttpStatusCode.NoContent);

    const service = new CourtAddressService();
    const result = await service.delete(courtId, addressId);

    expect(result).toEqual({
      status: 'deleted',
      courtName: 'Reading Crown Court',
      address,
    });
  });

  test('returns status code when delete API call does not return no content', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue({ name: 'Reading Crown Court' } as never);
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetailsById').mockResolvedValue(buildAddress());
    jest.spyOn(DataApiRequests.prototype, 'deleteCourtAddress').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new CourtAddressService();
    const result = await service.delete(courtId, addressId);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('returns court name when retrieveCourtName succeeds', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue({ name: 'Reading Crown Court' } as never);

    const service = new CourtAddressService();
    const result = await service.retrieveCourtName(courtId);

    expect(result).toBe('Reading Crown Court');
  });

  test('returns status code when retrieveCourtName fails', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(HttpStatusCode.NotFound);

    const service = new CourtAddressService();
    const result = await service.retrieveCourtName(courtId);

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('returns postcode validation messages and boolean validity', () => {
    const service = new CourtAddressService();

    expect(service.validatePostcode(undefined)).toBe(POSTCODE_ERROR_MESSAGES.blankPostcode);
    expect(service.validatePostcode('abc')).toBe(POSTCODE_ERROR_MESSAGES.invalidPostcode);
    expect(service.validatePostcode('BT1 1AA')).toBe(POSTCODE_ERROR_MESSAGES.northernIrelandPostcode);
    expect(service.isValidPostcode('SW1A 1AA')).toBe(true);
    expect(service.isValidPostcode('GY1 1AA')).toBe(false);
  });
});
