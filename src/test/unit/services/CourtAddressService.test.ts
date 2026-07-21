import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { CourtAddress, CourtAddressType } from '../../../main/schemas/courtAddressSchema';
import { CourtEntity } from '../../../main/schemas/courtEntitySchema';
import { CourtAddressService } from '../../../main/services/CourtAddressService';

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

  const buildCourt = (overrides: Partial<CourtEntity> = {}): CourtEntity => ({
    createdAt: '2026-06-10T10:00:00Z',
    id: courtId,
    lastUpdatedAt: '2026-06-10T10:00:00Z',
    mrdId: null,
    name: 'Reading Crown Court',
    open: false,
    openOnCath: false,
    regionId: '33333333-3333-4333-8333-333333333333',
    slug: 'reading-crown-court',
    warningNotice: null,
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

  test('returns status code when postcode search API returns an http status', async () => {
    jest
      .spyOn(DataApiRequests.prototype, 'getAddressesForPostcode')
      .mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new CourtAddressService();
    const result = await service.retrieveAddressOptions('SW1A 1AA');

    expect(result).toBe(HttpStatusCode.InternalServerError);
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

  test('retrieves all addresses for a court', async () => {
    const addresses = [buildAddress()];
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue(addresses);

    const service = new CourtAddressService();
    const result = await service.retrieveAll(courtId);

    expect(result).toEqual(addresses);
    expect(DataApiRequests.prototype.getCourtAddressDetails).toHaveBeenCalledWith(courtId);
  });

  test('returns optional field validation errors before saving', async () => {
    const getCourtAddressDetails = jest
      .spyOn(DataApiRequests.prototype, 'getCourtAddressDetails')
      .mockResolvedValue([]);
    const saveCourtAddress = jest.spyOn(DataApiRequests.prototype, 'saveCourtAddress');

    const service = new CourtAddressService();
    const result = await service.save(
      {
        addressLine1: 'Invalid #',
        addressLine2: `${'A'.repeat(256)}#`,
        addressType: undefined,
        county: `${'A'.repeat(256)}#`,
        courtTypes: ['1', '2', '3', '4', '5', '6'],
        epimId: `${'A'.repeat(11)}#`,
        areasOfLaw: ['1', '2', '3', '4', '5', '6'],
        postcode: 'SW1A 1AA',
        townCity: `${'A'.repeat(101)}#`,
      },
      courtId,
      true,
      true
    );

    expect(getCourtAddressDetails).toHaveBeenCalledWith(courtId);
    expect(saveCourtAddress).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'invalid',
      address: expect.objectContaining({
        errors: expect.objectContaining({
          addressType: ['Select an address type'],
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
          epimId: [
            'ePIMS Ref ID must be 10 characters or less',
            'ePIMS Ref ID must only include letters a to z, spaces and dashes.',
          ],
          areasOfLaw: ['Please select between 1 and 5 areas of law that this address is relevant for'],
          courtTypes: ['Please select at least one court type that this address is relevant for'],
          townCity: [
            'Town or city must be 100 characters or less',
            "Town or city must only include letters a to z, and special characters '(',')',':',',','.' and '-'",
          ],
        }),
      }),
    });
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

  test('returns status code when create address API returns an error status', async () => {
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([]);
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue({ name: 'Reading Crown Court' } as never);
    jest.spyOn(DataApiRequests.prototype, 'saveCourtAddress').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new CourtAddressService();
    const result = await service.save(buildAddress({ id: null }), courtId, false, false);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('creates a new address when addressId is not provided', async () => {
    const createdAddress = buildAddress({ id: null });
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([]);
    const court = buildCourt();
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(court);
    const saveCourtAddress = jest
      .spyOn(DataApiRequests.prototype, 'saveCourtAddress')
      .mockResolvedValue(createdAddress);
    const updateCourtAddress = jest.spyOn(DataApiRequests.prototype, 'updateCourtAddress');
    const openedCourt = { ...court, open: true };
    const updateCourt = jest.spyOn(DataApiRequests.prototype, 'updateCourt').mockResolvedValue(openedCourt);

    const service = new CourtAddressService();
    const result = await service.save(createdAddress, courtId, false, false);

    expect(saveCourtAddress).toHaveBeenCalledWith(createdAddress, courtId);
    expect(updateCourtAddress).not.toHaveBeenCalled();
    expect(updateCourt).toHaveBeenCalledWith(openedCourt);
    expect(result).toEqual({
      status: 'saved',
      courtName: 'Reading Crown Court',
      address: createdAddress,
      courtOpened: true,
    });
  });

  test('does not open the court when adding another address', async () => {
    const existingAddress = buildAddress();
    const createdAddress = buildAddress({ id: null, addressType: CourtAddressType.WRITE_TO_US });
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([existingAddress]);
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(buildCourt());
    jest.spyOn(DataApiRequests.prototype, 'saveCourtAddress').mockResolvedValue(createdAddress);
    const updateCourt = jest.spyOn(DataApiRequests.prototype, 'updateCourt');

    const service = new CourtAddressService();
    const result = await service.save(createdAddress, courtId, false, false);

    expect(updateCourt).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'saved',
      courtName: 'Reading Crown Court',
      address: createdAddress,
      courtOpened: false,
    });
  });

  test('does not open the court when it is already open', async () => {
    const createdAddress = buildAddress({ id: null });
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([]);
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(buildCourt({ open: true }));
    jest.spyOn(DataApiRequests.prototype, 'saveCourtAddress').mockResolvedValue(createdAddress);
    const updateCourt = jest.spyOn(DataApiRequests.prototype, 'updateCourt');

    const service = new CourtAddressService();
    const result = await service.save(createdAddress, courtId, false, false);

    expect(updateCourt).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'saved',
      courtName: 'Reading Crown Court',
      address: createdAddress,
      courtOpened: false,
    });
  });

  test('returns status code when opening the court after first address fails', async () => {
    const createdAddress = buildAddress({ id: null });
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([]);
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(buildCourt());
    jest.spyOn(DataApiRequests.prototype, 'saveCourtAddress').mockResolvedValue(createdAddress);
    jest.spyOn(DataApiRequests.prototype, 'updateCourt').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new CourtAddressService();
    const result = await service.save(createdAddress, courtId, false, false);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('returns bad request when opening the court after first address returns validation errors', async () => {
    const createdAddress = buildAddress({ id: null });
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([]);
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(buildCourt());
    jest.spyOn(DataApiRequests.prototype, 'saveCourtAddress').mockResolvedValue(createdAddress);
    jest.spyOn(DataApiRequests.prototype, 'updateCourt').mockResolvedValue(new Map([['open', 'Open is invalid']]));

    const service = new CourtAddressService();
    const result = await service.save(createdAddress, courtId, false, false);

    expect(result).toBe(HttpStatusCode.BadRequest);
  });

  test('updates an existing address when addressId is provided', async () => {
    const existingAddress = buildAddress();
    const updatedAddress = buildAddress({ addressLine1: '2 High Street' });
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([existingAddress]);
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(buildCourt());
    const updateCourtAddress = jest
      .spyOn(DataApiRequests.prototype, 'updateCourtAddress')
      .mockResolvedValue(updatedAddress);
    const saveCourtAddress = jest.spyOn(DataApiRequests.prototype, 'saveCourtAddress');
    const updateCourt = jest.spyOn(DataApiRequests.prototype, 'updateCourt');

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
    expect(updateCourt).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'saved',
      courtName: 'Reading Crown Court',
      address: updatedAddress,
      courtOpened: false,
    });
  });

  test('deletes an address and returns deleted payload when API deletion succeeds', async () => {
    const address = buildAddress();
    const address2 = buildAddress({ id: addressId.replaceAll('2', '3') });
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(buildCourt());
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([address, address2]);
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
    const address = buildAddress();
    const address2 = buildAddress({ id: addressId.replaceAll('2', '3') });
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(buildCourt());
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([address, address2]);
    jest.spyOn(DataApiRequests.prototype, 'deleteCourtAddress').mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new CourtAddressService();
    const result = await service.delete(courtId, addressId);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('returns status code when loading court fails during delete', async () => {
    const getCourtAddressDetailsById = jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetailsById');
    const deleteCourtAddress = jest.spyOn(DataApiRequests.prototype, 'deleteCourtAddress');
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(HttpStatusCode.NotFound);

    const service = new CourtAddressService();
    const result = await service.delete(courtId, addressId);

    expect(result).toBe(HttpStatusCode.NotFound);
    expect(getCourtAddressDetailsById).not.toHaveBeenCalled();
    expect(deleteCourtAddress).not.toHaveBeenCalled();
  });

  test('returns status code when loading address fails during delete', async () => {
    const deleteCourtAddress = jest.spyOn(DataApiRequests.prototype, 'deleteCourtAddress');
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(buildCourt());
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue(HttpStatusCode.NotFound);

    const service = new CourtAddressService();
    const result = await service.delete(courtId, addressId);

    expect(result).toBe(HttpStatusCode.NotFound);
    expect(deleteCourtAddress).not.toHaveBeenCalled();
  });

  test('returns not found when address is missing during delete', async () => {
    const deleteCourtAddress = jest.spyOn(DataApiRequests.prototype, 'deleteCourtAddress');
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue(buildCourt());
    jest
      .spyOn(DataApiRequests.prototype, 'getCourtAddressDetails')
      .mockResolvedValue([buildAddress({ id: '33333333-3333-4333-8333-333333333333' })]);

    const service = new CourtAddressService();
    const result = await service.delete(courtId, addressId);

    expect(result).toBe(HttpStatusCode.NotFound);
    expect(deleteCourtAddress).not.toHaveBeenCalled();
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

  test('returns invalid response when attempting to delete the last address', async () => {
    const onlyAddress = buildAddress();
    const deleteCourtAddress = jest.spyOn(DataApiRequests.prototype, 'deleteCourtAddress');
    jest.spyOn(DataApiRequests.prototype, 'getCourtById').mockResolvedValue({ name: 'Reading Crown Court' } as never);
    jest.spyOn(DataApiRequests.prototype, 'getCourtAddressDetails').mockResolvedValue([onlyAddress]);

    const service = new CourtAddressService();
    const result = await service.delete(courtId, addressId);

    expect(deleteCourtAddress).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'invalid',
      courtName: 'Reading Crown Court',
      address: {
        ...onlyAddress,
        errors: {
          message: ['Unable to delete this address: At least one address is required for a court.'],
        },
      },
    });
  });
});
