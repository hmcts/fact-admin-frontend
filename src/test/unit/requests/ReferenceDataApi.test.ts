import { HttpStatusCode } from 'axios';
import sinon, { restore, stub } from 'sinon';

const mockDataApiLogger = {
  error: jest.fn(),
  info: jest.fn(),
};

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue(mockDataApiLogger),
  },
}));

import { ReferenceDataApi } from '../../../main/requests/ReferenceDataApi';
import { dataApi } from '../../../main/requests/utils/axiosConfig';

const referenceDataApi = new ReferenceDataApi();

const errorResponse = {
  isAxiosError: true,
  response: {
    data: 'test error',
    status: 404,
  },
};

describe('ReferenceDataApi', () => {
  let getStub: sinon.SinonStub;

  beforeEach(() => {
    restore();
    jest.clearAllMocks();
    getStub = stub(dataApi, 'get');
  });

  it('returns parsed regions when the response is valid', async () => {
    const regions = [
      {
        country: 'England',
        id: '11111111-1111-4111-8111-111111111111',
        name: 'London',
      },
      {
        country: 'Wales',
        id: '22222222-2222-4222-8222-222222222222',
        name: 'South East Wales',
      },
    ];

    getStub.withArgs('/types/v1/regions').resolves({ data: regions });

    const response = await referenceDataApi.getRegions();

    expect(response).toEqual(regions);
  });

  it('returns not found when the regions endpoint returns a 404', async () => {
    getStub.withArgs('/types/v1/regions').rejects(errorResponse);

    const response = await referenceDataApi.getRegions();

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when the regions response fails schema validation', async () => {
    getStub.withArgs('/types/v1/regions').resolves({
      data: [{ country: 'England' }],
    });

    const response = await referenceDataApi.getRegions();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed opening hour types when the response is valid', async () => {
    const openingHourTypes = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Court open',
        nameCy: 'Oriau agor y Llys',
      },
    ];

    getStub.withArgs('/types/v1/opening-hours-types').resolves({ data: openingHourTypes });

    const response = await referenceDataApi.getOpeningHourTypes();

    expect(response).toEqual(openingHourTypes);
  });

  it('returns not found when fetching opening hour types fails with an axios status', async () => {
    getStub.withArgs('/types/v1/opening-hours-types').rejects(errorResponse);

    const response = await referenceDataApi.getOpeningHourTypes();

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when fetching opening hour types throws a non-axios error', async () => {
    getStub.withArgs('/types/v1/opening-hours-types').rejects(new Error('Unexpected error'));

    const response = await referenceDataApi.getOpeningHourTypes();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns not found when postcode search endpoint returns a non-400 axios error', async () => {
    const postcode = 'SW1A1ZZ';

    getStub.withArgs(`/search/address/v1/postcode/${postcode}`).rejects(errorResponse);

    const response = await referenceDataApi.getAddressesForPostcode(postcode);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when postcode search throws a non-axios error', async () => {
    const postcode = 'SW1A1ZZ';

    getStub.withArgs(`/search/address/v1/postcode/${postcode}`).rejects(new Error('Unexpected error'));

    const response = await referenceDataApi.getAddressesForPostcode(postcode);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed os data when postcode search response is valid', async () => {
    const postcode = 'SW1A1AA';
    const osData = {
      results: [
        {
          DPA: {
            UPRN: '100023336956',
            UDPRN: '10002333695',
            ADDRESS: '10 DOWNING STREET, LONDON, SW1A 2AA',
            ORGANISATION_NAME: null,
            BUILDING_NUMBER: '10',
            BUILDING_NAME: null,
            THOROUGHFARE_NAME: 'DOWNING STREET',
            POST_TOWN: 'LONDON',
            POSTCODE: 'SW1A 2AA',
            LNG: -0.127,
            LAT: 51.503,
            LOCAL_CUSTODIAN_CODE: 5990,
            LOCAL_CUSTODIAN_CODE_DESCRIPTION: 'WESTMINSTER',
          },
        },
      ],
    };

    getStub.withArgs(`/search/address/v1/postcode/${postcode}`).resolves({ data: osData });

    const response = await referenceDataApi.getAddressesForPostcode(postcode);

    expect(response).toEqual(osData);
  });

  it('returns validation errors map when postcode search endpoint returns a 400', async () => {
    const postcode = 'bad-postcode';
    const apiErrors = {
      postcode: 'Postcode is invalid',
    };

    getStub.withArgs(`/search/address/v1/postcode/${postcode}`).rejects({
      isAxiosError: true,
      response: {
        data: apiErrors,
        status: 400,
      },
    });

    const response = await referenceDataApi.getAddressesForPostcode(postcode);

    expect(response).toEqual(new Map(Object.entries(apiErrors)));
  });

  it('returns service unavailable when areas of law endpoint returns a 503', async () => {
    getStub.withArgs('/types/v1/areas-of-law').rejects({
      isAxiosError: true,
      response: {
        data: 'service unavailable',
        status: 503,
      },
    });

    const response = await referenceDataApi.getAreasOfLaw();

    expect(response).toBe(HttpStatusCode.ServiceUnavailable);
  });

  it('returns parsed areas of law when response is valid', async () => {
    const areasOfLaw = [
      {
        id: '99999999-9999-4999-8999-999999999999',
        name: 'Immigration',
        nameCy: 'Mewnfudo',
        externalLink: null,
        externalLinkCy: null,
        displayName: null,
        displayNameCy: null,
      },
    ];

    getStub.withArgs('/types/v1/areas-of-law').resolves({ data: areasOfLaw });

    const response = await referenceDataApi.getAreasOfLaw();

    expect(response).toEqual(areasOfLaw);
  });

  it('returns internal server error when areas of law response fails schema validation', async () => {
    getStub.withArgs('/types/v1/areas-of-law').resolves({
      data: [{ name: 'Missing required fields' }],
    });

    const response = await referenceDataApi.getAreasOfLaw();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed service areas when response is valid', async () => {
    const serviceAreas = [
      {
        id: '99999999-9999-4999-8999-999999999999',
        name: 'Money claims',
        nameCy: 'Money claims',
      },
    ];

    getStub.withArgs('/types/v1/service-areas').resolves({ data: serviceAreas });

    const response = await referenceDataApi.getServiceAreas();

    expect(response).toEqual(serviceAreas);
  });

  it('returns internal server error when service areas response fails schema validation', async () => {
    getStub.withArgs('/types/v1/service-areas').resolves({
      data: [{ name: 'Missing id' }],
    });

    const response = await referenceDataApi.getServiceAreas();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns status code when service areas request fails with axios error', async () => {
    getStub.withArgs('/types/v1/service-areas').rejects(errorResponse);

    const response = await referenceDataApi.getServiceAreas();

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns parsed court types when response is valid', async () => {
    const courtTypes = [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        name: 'County Court',
      },
    ];

    getStub.withArgs('/types/v1/court-types').resolves({ data: courtTypes });

    const response = await referenceDataApi.getCourtTypes();

    expect(response).toEqual(courtTypes);
  });

  it('returns internal server error when court types response fails schema validation', async () => {
    getStub.withArgs('/types/v1/court-types').resolves({
      data: [{ name: 'Missing required fields' }],
    });

    const response = await referenceDataApi.getCourtTypes();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns unauthorized when court types endpoint returns a 401', async () => {
    getStub.withArgs('/types/v1/court-types').rejects({
      isAxiosError: true,
      response: {
        data: 'unauthorized',
        status: 401,
      },
    });

    const response = await referenceDataApi.getCourtTypes();

    expect(response).toBe(HttpStatusCode.Unauthorized);
  });

  it('returns parsed contact description types when response is valid', async () => {
    const contactDescriptionTypes = [
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Enquiries',
        nameCy: 'Ymholiadau',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Listing enquiries',
        nameCy: 'Ymholiadau rhestru',
      },
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'General enquiries',
        nameCy: 'Ymholiadau cyffredinol',
      },
    ];

    getStub.withArgs('/types/v1/contact-description-types').resolves({ data: contactDescriptionTypes });

    const response = await referenceDataApi.getContactDescriptionTypes();

    expect(response).toEqual([
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Enquiries',
        nameCy: 'Ymholiadau',
      },
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'General enquiries',
        nameCy: 'Ymholiadau cyffredinol',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Listing enquiries',
        nameCy: 'Ymholiadau rhestru',
      },
    ]);
  });

  it('returns internal server error when contact description types response fails schema validation', async () => {
    getStub.withArgs('/types/v1/contact-description-types').resolves({
      data: [{ name: 'Missing id' }],
    });

    const response = await referenceDataApi.getContactDescriptionTypes();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns service unavailable when contact description types endpoint returns a 503', async () => {
    getStub.withArgs('/types/v1/contact-description-types').rejects({
      isAxiosError: true,
      response: {
        data: 'service unavailable',
        status: HttpStatusCode.ServiceUnavailable,
      },
    });

    const response = await referenceDataApi.getContactDescriptionTypes();

    expect(response).toBe(HttpStatusCode.ServiceUnavailable);
  });

  it('returns parsed local authorities when response is valid', async () => {
    const localAuthorities = [
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        name: 'Local Authority A',
        custodianCode: 1234,
        childCustodianCodes: [1235, 1236],
      },
    ];

    getStub.withArgs('/types/v1/local-authorities').resolves({ data: localAuthorities });

    const response = await referenceDataApi.getLocalAuthorities();

    expect(response).toEqual(localAuthorities);
  });

  it('returns internal server error when local authorities response fails schema validation', async () => {
    getStub.withArgs('/types/v1/local-authorities').resolves({
      data: [{ name: 'Missing required fields' }],
    });

    const response = await referenceDataApi.getLocalAuthorities();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });
});
