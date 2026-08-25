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

import { ServiceCentreApi } from '../../../main/requests/ServiceCentreApi';
import { dataApi } from '../../../main/requests/utils/axiosConfig';

const serviceCentreApi = new ServiceCentreApi();

const errorResponse = {
  isAxiosError: true,
  response: {
    data: 'test error',
    status: 404,
  },
};

const errorMessage = {
  message: 'test',
};

describe('ServiceCentreApi', () => {
  let getStub: sinon.SinonStub;
  let postStub: sinon.SinonStub;
  let putStub: sinon.SinonStub;
  let deleteStub: sinon.SinonStub;

  beforeEach(() => {
    restore();
    jest.clearAllMocks();
    getStub = stub(dataApi, 'get');
    postStub = stub(dataApi, 'post');
    putStub = stub(dataApi, 'put');
    deleteStub = stub(dataApi, 'delete');
  });

  it('returns parsed service centre when the service centre by exact name response is valid', async () => {
    const serviceCentreName = 'National Business Centre';
    const serviceCentre = {
      createdAt: '2026-04-29T09:00:00Z',
      id: '66666666-6666-4666-8666-666666666666',
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      name: serviceCentreName,
      open: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      serviceAreaIds: ['77777777-7777-4777-8777-777777777777'],
      slug: 'national-business-centre',
      warningNotice: null,
    };

    getStub.withArgs('/service-centres/name/v1', { params: { name: serviceCentreName } }).resolves({
      data: serviceCentre,
    });

    const response = await serviceCentreApi.getServiceCentreByName(serviceCentreName);

    expect(response).toEqual(serviceCentre);
  });

  it('returns parsed service centre when the service centre by id response is valid', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const serviceCentre = {
      createdAt: '2026-04-29T09:00:00Z',
      id: serviceCentreId,
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      name: 'National Business Centre',
      open: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      serviceAreaIds: ['77777777-7777-4777-8777-777777777777'],
      slug: 'national-business-centre',
      warningNotice: null,
    };

    getStub.withArgs(`/service-centres/${serviceCentreId}/entity/v1`).resolves({
      data: serviceCentre,
    });

    const response = await serviceCentreApi.getServiceCentreById(serviceCentreId);

    expect(response).toEqual(serviceCentre);
  });

  it('returns not found when the service centre by id endpoint returns a 404', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';

    getStub.withArgs(`/service-centres/${serviceCentreId}/entity/v1`).rejects(errorResponse);

    const response = await serviceCentreApi.getServiceCentreById(serviceCentreId);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns not found when the service centre by exact name endpoint returns a 404', async () => {
    const serviceCentreName = 'National Business Centre';

    getStub.withArgs('/service-centres/name/v1', { params: { name: serviceCentreName } }).rejects(errorResponse);

    const response = await serviceCentreApi.getServiceCentreByName(serviceCentreName);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns status code when the service centre by exact name endpoint returns a non-404 axios error', async () => {
    const serviceCentreName = 'National Business Centre';

    getStub.withArgs('/service-centres/name/v1', { params: { name: serviceCentreName } }).rejects({
      isAxiosError: true,
      response: {
        data: 'conflict',
        status: HttpStatusCode.Conflict,
      },
    });

    const response = await serviceCentreApi.getServiceCentreByName(serviceCentreName);

    expect(response).toBe(HttpStatusCode.Conflict);
  });

  it('returns internal server error when the service centre by exact name request fails without an axios status', async () => {
    const serviceCentreName = 'National Business Centre';

    getStub.withArgs('/service-centres/name/v1', { params: { name: serviceCentreName } }).rejects(errorMessage);

    const response = await serviceCentreApi.getServiceCentreByName(serviceCentreName);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed service centre when create service centre succeeds', async () => {
    const payload = {
      name: 'National Business Centre',
      open: false,
      regionId: '33333333-3333-4333-8333-333333333333',
      serviceAreaIds: ['77777777-7777-4777-8777-777777777777'],
    };
    const serviceCentre = {
      createdAt: '2026-04-29T09:00:00Z',
      id: '66666666-6666-4666-8666-666666666666',
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      name: payload.name,
      open: false,
      regionId: payload.regionId,
      serviceAreaIds: payload.serviceAreaIds,
      slug: 'national-business-centre',
      warningNotice: null,
    };

    postStub.withArgs('/service-centres/v1', payload).resolves({ data: serviceCentre });

    const response = await serviceCentreApi.createServiceCentre(payload);

    expect(response).toEqual(serviceCentre);
  });

  it('returns a validation map when create service centre returns a 400', async () => {
    const payload = {
      name: 'National Business Centre',
      open: false,
      regionId: '33333333-3333-4333-8333-333333333333',
      serviceAreaIds: ['77777777-7777-4777-8777-777777777777'],
    };
    const badRequestError = {
      isAxiosError: true,
      response: {
        data: {
          name: 'Name already exists',
        },
        status: HttpStatusCode.BadRequest,
      },
    };

    postStub.withArgs('/service-centres/v1', payload).rejects(badRequestError);

    const response = await serviceCentreApi.createServiceCentre(payload);

    expect(response).toEqual(new Map([['name', 'Name already exists']]));
  });

  it('returns status code when create service centre fails with non-400 axios error', async () => {
    const payload = {
      name: 'National Business Centre',
      open: false,
      regionId: '33333333-3333-4333-8333-333333333333',
      serviceAreaIds: ['77777777-7777-4777-8777-777777777777'],
    };

    postStub.withArgs('/service-centres/v1', payload).rejects({
      isAxiosError: true,
      response: {
        data: 'conflict',
        status: HttpStatusCode.Conflict,
      },
    });

    const response = await serviceCentreApi.createServiceCentre(payload);

    expect(response).toBe(HttpStatusCode.Conflict);
  });

  it('returns internal server error when create service centre response fails schema validation', async () => {
    const payload = {
      name: 'National Business Centre',
      open: false,
      regionId: '33333333-3333-4333-8333-333333333333',
      serviceAreaIds: ['77777777-7777-4777-8777-777777777777'],
    };

    postStub.withArgs('/service-centres/v1', payload).resolves({
      data: {
        id: '66666666-6666-4666-8666-666666666666',
        name: payload.name,
      },
    });

    const response = await serviceCentreApi.createServiceCentre(payload);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed service centre details when service centre by id response is valid', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const serviceCentre = {
      createdAt: '2026-04-29T09:00:00Z',
      id: serviceCentreId,
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      name: 'National Business Centre',
      open: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      serviceAreaIds: ['77777777-7777-4777-8777-777777777777'],
      slug: 'national-business-centre',
      warningNotice: null,
    };

    getStub.withArgs(`/service-centres/${serviceCentreId}/entity/v1`).resolves({ data: serviceCentre });

    const response = await serviceCentreApi.getServiceCentreById(serviceCentreId);

    expect(response).toEqual(serviceCentre);
  });

  it('returns status code when service centre by id request fails', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';

    getStub.withArgs(`/service-centres/${serviceCentreId}/entity/v1`).rejects({
      isAxiosError: true,
      response: {
        data: 'forbidden',
        status: HttpStatusCode.Forbidden,
      },
    });

    const response = await serviceCentreApi.getServiceCentreById(serviceCentreId);

    expect(response).toBe(HttpStatusCode.Forbidden);
  });

  it('returns a validation map when update service centre returns a 400', async () => {
    const serviceCentre = {
      createdAt: '2026-04-29T09:00:00Z',
      id: '66666666-6666-4666-8666-666666666666',
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      name: 'Updated National Business Centre',
      open: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      serviceAreaIds: ['77777777-7777-4777-8777-777777777777'],
      slug: 'national-business-centre',
      warningNotice: null,
    };

    putStub.withArgs(`/service-centres/${serviceCentre.id}/v1`, serviceCentre).rejects({
      isAxiosError: true,
      response: {
        data: {
          name: 'Name already exists',
        },
        status: HttpStatusCode.BadRequest,
      },
    });

    const response = await serviceCentreApi.updateServiceCentre(serviceCentre);

    expect(response).toEqual(new Map([['name', 'Name already exists']]));
  });

  it('returns parsed service centre areas of law when response is valid', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const areasOfLaw = {
      'AreaOfLawType(id=66666666-6666-4666-8666-666666666666, name=Divorce, nameCy=Ysgariad, externalLink=null, externalLinkCy=null, displayName=Divorce and separation, displayNameCy=Ysgariad a gwahanu)': true,
      'AreaOfLawType(id=77777777-7777-4777-8777-777777777777, name=Probate, nameCy=Profiant, externalLink=null, externalLinkCy=null, displayName=null, displayNameCy=null)': false,
    };

    getStub.withArgs(`/service-centres/${serviceCentreId}/v1/areas-of-law`).resolves({ data: areasOfLaw });

    const response = await serviceCentreApi.getServiceCentreAreasOfLaw(serviceCentreId);

    expect(response).toEqual([
      expect.objectContaining({ selected: true }),
      expect.objectContaining({ selected: false }),
    ]);
  });

  it('returns status when updating service centre areas of law fails', async () => {
    const payload = {
      serviceCentreId: '66666666-6666-4666-8666-666666666666',
      areasOfLaw: ['77777777-7777-4777-8777-777777777777'],
    };

    putStub.withArgs(`/service-centres/${payload.serviceCentreId}/v1/areas-of-law`, payload).rejects({
      isAxiosError: true,
      response: {
        data: 'error',
        status: HttpStatusCode.BadGateway,
      },
    });

    const response = await serviceCentreApi.updateServiceCentreAreasOfLaw(payload);

    expect(response).toBe(HttpStatusCode.BadGateway);
  });

  it('returns internal server error when service centre areas of law request fails without an axios status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';

    getStub.withArgs(`/service-centres/${serviceCentreId}/v1/areas-of-law`).rejects(errorMessage);

    const response = await serviceCentreApi.getServiceCentreAreasOfLaw(serviceCentreId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed service-centre addresses when response is valid', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const addresses = [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        serviceCentreId,
        addressLine1: '1 Test Street',
        addressLine2: null,
        townCity: 'London',
        county: null,
        postcode: 'SW1A 1AA',
        lat: null,
        lon: null,
        addressType: 'VISIT_US',
      },
    ];

    getStub.withArgs(`/service-centres/${serviceCentreId}/v1/address`).resolves({ data: addresses });

    const response = await serviceCentreApi.getServiceCentreAddressDetails(serviceCentreId);

    expect(response).toEqual(addresses);
  });

  it('returns parsed service-centre address by id when response is valid', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const addressId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const address = {
      id: addressId,
      serviceCentreId,
      addressLine1: '1 Test Street',
      addressLine2: null,
      townCity: 'London',
      county: null,
      postcode: 'SW1A 1AA',
      lat: null,
      lon: null,
      addressType: 'VISIT_US',
    };

    getStub.withArgs(`/service-centres/${serviceCentreId}/v1/address/${addressId}`).resolves({ data: address });

    const response = await serviceCentreApi.getServiceCentreAddressDetailsById(serviceCentreId, addressId);

    expect(response).toEqual(address);
  });

  it('returns status code when service-centre address by id request fails with axios status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const addressId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    getStub.withArgs(`/service-centres/${serviceCentreId}/v1/address/${addressId}`).rejects({
      isAxiosError: true,
      response: {
        data: 'forbidden',
        status: HttpStatusCode.Forbidden,
      },
    });

    const response = await serviceCentreApi.getServiceCentreAddressDetailsById(serviceCentreId, addressId);

    expect(response).toBe(HttpStatusCode.Forbidden);
  });

  it('returns internal server error when service-centre address by id request fails without an axios status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const addressId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    getStub.withArgs(`/service-centres/${serviceCentreId}/v1/address/${addressId}`).rejects(errorMessage);

    const response = await serviceCentreApi.getServiceCentreAddressDetailsById(serviceCentreId, addressId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed service-centre address when saving service-centre address succeeds', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const payload = {
      addressLine1: '1 Test Street',
      postcode: 'SW1A 1AA',
      townCity: 'London',
      addressType: 'VISIT_US' as const,
    };
    const savedAddress = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      serviceCentreId,
      addressLine1: payload.addressLine1,
      addressLine2: null,
      townCity: payload.townCity,
      county: null,
      postcode: payload.postcode,
      lat: null,
      lon: null,
      addressType: payload.addressType,
    };

    postStub.withArgs(`/service-centres/${serviceCentreId}/v1/address`, payload).resolves({ data: savedAddress });

    const response = await serviceCentreApi.saveServiceCentreAddress(payload, serviceCentreId);

    expect(response).toEqual(savedAddress);
  });

  it('returns a validation map when saving service-centre address returns 400', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const payload = {
      addressLine1: '1 Test Street',
      postcode: 'SW1A 1AA',
      townCity: 'London',
      addressType: 'VISIT_US' as const,
    };

    postStub.withArgs(`/service-centres/${serviceCentreId}/v1/address`, payload).rejects({
      isAxiosError: true,
      response: {
        data: {
          postcode: 'Invalid postcode',
        },
        status: HttpStatusCode.BadRequest,
      },
    });

    const response = await serviceCentreApi.saveServiceCentreAddress(payload, serviceCentreId);

    expect(response).toEqual(new Map([['postcode', 'Invalid postcode']]));
  });

  it('returns parsed service-centre address when updating service-centre address succeeds', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const addressId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const payload = {
      addressLine1: '1 Test Street',
      postcode: 'SW1A 1AA',
      townCity: 'London',
      addressType: 'VISIT_US' as const,
    };
    const updatedAddress = {
      id: addressId,
      serviceCentreId,
      addressLine1: payload.addressLine1,
      addressLine2: null,
      townCity: payload.townCity,
      county: null,
      postcode: payload.postcode,
      lat: null,
      lon: null,
      addressType: payload.addressType,
    };

    putStub
      .withArgs(`/service-centres/${serviceCentreId}/v1/address/${addressId}`, payload)
      .resolves({ data: updatedAddress });

    const response = await serviceCentreApi.updateServiceCentreAddress(payload, serviceCentreId, addressId);

    expect(response).toEqual(updatedAddress);
  });

  it('returns a validation map when updating service-centre address returns 400', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const addressId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const payload = {
      addressLine1: '1 Test Street',
      postcode: 'SW1A 1AA',
      townCity: 'London',
      addressType: 'VISIT_US' as const,
    };

    putStub.withArgs(`/service-centres/${serviceCentreId}/v1/address/${addressId}`, payload).rejects({
      isAxiosError: true,
      response: {
        data: {
          postcode: 'Invalid postcode',
        },
        status: HttpStatusCode.BadRequest,
      },
    });

    const response = await serviceCentreApi.updateServiceCentreAddress(payload, serviceCentreId, addressId);

    expect(response).toEqual(new Map([['postcode', 'Invalid postcode']]));
  });

  it('returns status code when updating service-centre address fails with non-400 axios status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const addressId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const payload = {
      addressLine1: '1 Test Street',
      postcode: 'SW1A 1AA',
      townCity: 'London',
      addressType: 'VISIT_US' as const,
    };

    putStub.withArgs(`/service-centres/${serviceCentreId}/v1/address/${addressId}`, payload).rejects({
      isAxiosError: true,
      response: {
        data: 'conflict',
        status: HttpStatusCode.Conflict,
      },
    });

    const response = await serviceCentreApi.updateServiceCentreAddress(payload, serviceCentreId, addressId);

    expect(response).toBe(HttpStatusCode.Conflict);
  });

  it('returns internal server error when deleting service-centre address gets unexpected success status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const addressId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    deleteStub.withArgs(`/service-centres/${serviceCentreId}/v1/address/${addressId}`).resolves({
      status: HttpStatusCode.Ok,
    });

    const response = await serviceCentreApi.deleteServiceCentreAddress(serviceCentreId, addressId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed service-centre contact details when response is valid', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const contactDetails = [
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        serviceCentreId,
        serviceCentreContactDescriptionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        serviceCentreContactDescription: null,
        explanation: 'General enquiries',
        explanationCy: null,
        email: 'enquiries@example.test',
        phoneNumber: '01234 567890',
      },
    ];

    getStub.withArgs(`/service-centres/${serviceCentreId}/v1/contact-details`).resolves({ data: contactDetails });

    const response = await serviceCentreApi.getServiceCentreContactDetails(serviceCentreId);

    expect(response).toEqual(contactDetails);
  });

  it('returns status code when service-centre contact details request fails with axios status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';

    getStub.withArgs(`/service-centres/${serviceCentreId}/v1/contact-details`).rejects({
      isAxiosError: true,
      response: {
        data: 'bad gateway',
        status: HttpStatusCode.BadGateway,
      },
    });

    const response = await serviceCentreApi.getServiceCentreContactDetails(serviceCentreId);

    expect(response).toBe(HttpStatusCode.BadGateway);
  });

  it('returns a validation map when creating service-centre contact detail returns 400', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const payload = {
      serviceCentreId,
      serviceCentreContactDescriptionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      explanation: 'General enquiries',
      email: 'enquiries@example.test',
      phoneNumber: undefined,
    };

    postStub.withArgs(`/service-centres/${serviceCentreId}/v1/contact-details`, payload).rejects({
      isAxiosError: true,
      response: {
        data: {
          email: 'Email is invalid',
        },
        status: HttpStatusCode.BadRequest,
      },
    });

    const response = await serviceCentreApi.createServiceCentreContactDetail(serviceCentreId, payload);

    expect(response).toEqual(new Map([['email', 'Email is invalid']]));
  });

  it('returns status when creating service-centre contact detail fails with non-400 axios status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const payload = {
      serviceCentreId,
      serviceCentreContactDescriptionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      explanation: 'General enquiries',
      email: 'enquiries@example.test',
      phoneNumber: undefined,
    };

    postStub.withArgs(`/service-centres/${serviceCentreId}/v1/contact-details`, payload).rejects({
      isAxiosError: true,
      response: {
        data: 'unprocessable',
        status: HttpStatusCode.UnprocessableEntity,
      },
    });

    const response = await serviceCentreApi.createServiceCentreContactDetail(serviceCentreId, payload);

    expect(response).toBe(HttpStatusCode.UnprocessableEntity);
  });

  it('returns status when updating service-centre contact detail succeeds', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const contactDetailId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const payload = {
      serviceCentreId,
      serviceCentreContactDescriptionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      explanation: 'General enquiries',
      email: 'enquiries@example.test',
      phoneNumber: undefined,
    };

    putStub
      .withArgs(`/service-centres/${serviceCentreId}/v1/contact-details/${contactDetailId}`, payload)
      .resolves({ status: HttpStatusCode.Ok });

    const response = await serviceCentreApi.updateServiceCentreContactDetail(serviceCentreId, contactDetailId, payload);

    expect(response).toBe(HttpStatusCode.Ok);
  });

  it('returns a validation map when updating service-centre contact detail returns 400', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const contactDetailId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const payload = {
      serviceCentreId,
      serviceCentreContactDescriptionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      explanation: 'General enquiries',
      email: 'enquiries.example.test',
      phoneNumber: undefined,
    };

    putStub.withArgs(`/service-centres/${serviceCentreId}/v1/contact-details/${contactDetailId}`, payload).rejects({
      isAxiosError: true,
      response: {
        data: {
          email: 'Email is invalid',
        },
        status: HttpStatusCode.BadRequest,
      },
    });

    const response = await serviceCentreApi.updateServiceCentreContactDetail(serviceCentreId, contactDetailId, payload);

    expect(response).toEqual(new Map([['email', 'Email is invalid']]));
  });

  it('returns internal server error when deleting service-centre contact detail gets unexpected success status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const contactDetailId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    deleteStub
      .withArgs(`/service-centres/${serviceCentreId}/v1/contact-details/${contactDetailId}`)
      .resolves({ status: HttpStatusCode.Ok });

    const response = await serviceCentreApi.deleteServiceCentreContactDetail(serviceCentreId, contactDetailId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed service centre when update service centre succeeds', async () => {
    const serviceCentre = {
      createdAt: '2026-04-29T09:00:00Z',
      id: '66666666-6666-4666-8666-666666666666',
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      name: 'Updated National Business Centre',
      open: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      serviceAreaIds: ['77777777-7777-4777-8777-777777777777'],
      slug: 'national-business-centre',
      warningNotice: null,
    };

    putStub.withArgs(`/service-centres/${serviceCentre.id}/v1`, serviceCentre).resolves({ data: serviceCentre });

    const response = await serviceCentreApi.updateServiceCentre(serviceCentre);

    expect(response).toEqual(serviceCentre);
  });

  it('returns status when updating service centre areas of law succeeds', async () => {
    const payload = {
      serviceCentreId: '66666666-6666-4666-8666-666666666666',
      areasOfLaw: ['77777777-7777-4777-8777-777777777777'],
    };

    putStub.withArgs(`/service-centres/${payload.serviceCentreId}/v1/areas-of-law`, payload).resolves({
      status: HttpStatusCode.NoContent,
    });

    const response = await serviceCentreApi.updateServiceCentreAreasOfLaw(payload);

    expect(response).toBe(HttpStatusCode.NoContent);
  });

  it('returns status when creating service-centre contact detail succeeds', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const payload = {
      serviceCentreId,
      serviceCentreContactDescriptionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      explanation: 'General enquiries',
      email: 'enquiries@example.test',
      phoneNumber: undefined,
    };

    postStub.withArgs(`/service-centres/${serviceCentreId}/v1/contact-details`, payload).resolves({
      status: HttpStatusCode.Created,
    });

    const response = await serviceCentreApi.createServiceCentreContactDetail(serviceCentreId, payload);

    expect(response).toBe(HttpStatusCode.Created);
  });

  it('returns status when updating service-centre contact detail fails with non-400 axios status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const contactDetailId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const payload = {
      serviceCentreId,
      serviceCentreContactDescriptionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      explanation: 'General enquiries',
      email: 'enquiries@example.test',
      phoneNumber: undefined,
    };

    putStub.withArgs(`/service-centres/${serviceCentreId}/v1/contact-details/${contactDetailId}`, payload).rejects({
      isAxiosError: true,
      response: {
        data: 'unprocessable',
        status: HttpStatusCode.UnprocessableEntity,
      },
    });

    const response = await serviceCentreApi.updateServiceCentreContactDetail(serviceCentreId, contactDetailId, payload);

    expect(response).toBe(HttpStatusCode.UnprocessableEntity);
  });

  it('returns no content when deleting service-centre contact detail succeeds', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const contactDetailId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    deleteStub
      .withArgs(`/service-centres/${serviceCentreId}/v1/contact-details/${contactDetailId}`)
      .resolves({ status: HttpStatusCode.NoContent });

    const response = await serviceCentreApi.deleteServiceCentreContactDetail(serviceCentreId, contactDetailId);

    expect(response).toBe(HttpStatusCode.NoContent);
  });

  it('returns status when deleting service-centre contact detail fails with an axios status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const contactDetailId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    deleteStub.withArgs(`/service-centres/${serviceCentreId}/v1/contact-details/${contactDetailId}`).rejects({
      isAxiosError: true,
      response: {
        data: 'bad gateway',
        status: HttpStatusCode.BadGateway,
      },
    });

    const response = await serviceCentreApi.deleteServiceCentreContactDetail(serviceCentreId, contactDetailId);

    expect(response).toBe(HttpStatusCode.BadGateway);
  });

  it('returns status code when service centre areas of law request fails with axios status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';

    getStub.withArgs(`/service-centres/${serviceCentreId}/v1/areas-of-law`).rejects({
      isAxiosError: true,
      response: {
        data: 'bad gateway',
        status: HttpStatusCode.BadGateway,
      },
    });

    const response = await serviceCentreApi.getServiceCentreAreasOfLaw(serviceCentreId);

    expect(response).toBe(HttpStatusCode.BadGateway);
  });

  it('returns internal server error when saving service-centre address fails without an axios status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const payload = {
      addressLine1: '1 Test Street',
      postcode: 'SW1A 1AA',
      townCity: 'London',
      addressType: 'VISIT_US' as const,
    };

    postStub.withArgs(`/service-centres/${serviceCentreId}/v1/address`, payload).rejects(errorMessage);

    const response = await serviceCentreApi.saveServiceCentreAddress(payload, serviceCentreId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns internal server error when updating service-centre contact detail fails without an axios status', async () => {
    const serviceCentreId = '66666666-6666-4666-8666-666666666666';
    const contactDetailId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const payload = {
      serviceCentreId,
      serviceCentreContactDescriptionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      explanation: 'General enquiries',
      email: 'enquiries@example.test',
      phoneNumber: undefined,
    };

    putStub
      .withArgs(`/service-centres/${serviceCentreId}/v1/contact-details/${contactDetailId}`, payload)
      .rejects(errorMessage);

    const response = await serviceCentreApi.updateServiceCentreContactDetail(serviceCentreId, contactDetailId, payload);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });
});
