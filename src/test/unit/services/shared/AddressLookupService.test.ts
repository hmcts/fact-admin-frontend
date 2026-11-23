import { HttpStatusCode } from 'axios';

import { AddressLookupService } from '../../../../main/services/shared/AddressLookupService';

describe('AddressLookupService', () => {
  test.each([
    undefined,
    null,
    { largeUser: false, terminated: false },
    { largeUser: true, terminated: false },
    { largeUser: false, terminated: true },
    { largeUser: true, terminated: true },
  ])('preserves metadata with empty results: %j', async postcodeMetadata => {
    const referenceDataApi = {
      getAddressesForPostcode: jest.fn().mockResolvedValue({ results: [], postcodeMetadata }),
    };
    const service = new AddressLookupService(referenceDataApi as never);

    await expect(service.retrieveOptions('NG8 5RN')).resolves.toEqual({
      addresses: [],
      postcodeMetadata,
    });
  });

  test('returns postcode-not-found validation for a message error', async () => {
    const referenceDataApi = {
      getAddressesForPostcode: jest.fn().mockResolvedValue(new Map([['message', 'not found']])),
    };
    const service = new AddressLookupService(referenceDataApi as never);

    await expect(service.retrieveOptions('SW1A 1AA')).resolves.toEqual({
      error: 'Postcode not found',
      status: 'invalid',
    });
  });

  test('returns bad request for other validation maps', async () => {
    const referenceDataApi = {
      getAddressesForPostcode: jest.fn().mockResolvedValue(new Map([['postcode', 'invalid']])),
    };
    const service = new AddressLookupService(referenceDataApi as never);

    await expect(service.retrieveOptions('invalid')).resolves.toBe(HttpStatusCode.BadRequest);
  });

  test('propagates HTTP statuses', async () => {
    const referenceDataApi = {
      getAddressesForPostcode: jest.fn().mockResolvedValue(HttpStatusCode.ServiceUnavailable),
    };
    const service = new AddressLookupService(referenceDataApi as never);

    await expect(service.retrieveOptions('SW1A 1AA')).resolves.toBe(HttpStatusCode.ServiceUnavailable);
  });
});
