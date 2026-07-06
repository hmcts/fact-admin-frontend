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

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { dataApi } from '../../../main/requests/utils/axiosConfig';

const dataApiRequests = new DataApiRequests();

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

describe('DataApiRequests', () => {
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

  it('returns true when health status is UP', async () => {
    getStub.withArgs('/health').resolves({ data: { status: 'UP' } });
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(true);
  });

  it('returns false when health status is not UP', async () => {
    getStub.withArgs('/health').resolves({ data: { status: 'DOWN' } });
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(false);
  });

  it('returns false on error response', async () => {
    getStub.withArgs('/health').rejects(errorResponse);
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(false);
  });

  it('returns false on error message', async () => {
    getStub.withArgs('/health').rejects(errorMessage);
    const response = await dataApiRequests.checkHealth();
    expect(response).toBe(false);
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

    const response = await dataApiRequests.getRegions();

    expect(response).toEqual(regions);
  });

  it('returns not found when the regions endpoint returns a 404', async () => {
    getStub.withArgs('/types/v1/regions').rejects(errorResponse);

    const response = await dataApiRequests.getRegions();

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when the regions response fails schema validation', async () => {
    getStub.withArgs('/types/v1/regions').resolves({
      data: [{ country: 'England' }],
    });

    const response = await dataApiRequests.getRegions();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed paginated courts when the response is valid', async () => {
    const params = {
      includeClosed: false,
      pageNumber: 0,
      pageSize: 25,
      partialCourtName: 'London',
      regionId: '33333333-3333-4333-8333-333333333333',
      sortBy: 'name' as const,
      sortOrder: 'desc' as const,
    };
    const courts = {
      content: [
        {
          createdAt: '2026-04-29T09:00:00Z',
          id: '44444444-4444-4444-8444-444444444444',
          lastUpdatedAt: '2026-04-29T10:00:00Z',
          locationType: 'COURT',
          mrdId: 'MRD-123',
          name: 'London Civil and Family Court',
          open: true,
          openOnCath: true,
          regionId: '33333333-3333-4333-8333-333333333333',
          serviceCentre: false,
          slug: 'london-civil-and-family-court',
          warningNotice: null,
        },
        {
          createdAt: '2026-04-29T09:30:00Z',
          id: '55555555-5555-4555-8555-555555555555',
          lastUpdatedAt: '2026-04-29T11:00:00Z',
          locationType: 'SERVICE_CENTRE',
          mrdId: null,
          name: 'National Business Centre',
          open: true,
          openOnCath: null,
          regionId: '33333333-3333-4333-8333-333333333333',
          serviceCentre: true,
          slug: 'national-business-centre',
          warningNotice: null,
        },
      ],
      page: {
        number: 0,
        size: 25,
        totalElements: 2,
        totalPages: 1,
      },
    };

    getStub.withArgs('/all/v1', { params }).resolves({ data: courts });

    const response = await dataApiRequests.getCourts(params);

    expect(response).toEqual(courts);
  });

  it('returns forbidden when the courts endpoint returns a 403', async () => {
    const forbiddenError = {
      isAxiosError: true,
      response: {
        data: 'forbidden',
        status: 403,
      },
    };

    getStub.withArgs('/all/v1', { params: {} }).rejects(forbiddenError);

    const response = await dataApiRequests.getCourts();

    expect(response).toBe(HttpStatusCode.Forbidden);
  });

  it('returns internal server error when the courts response fails schema validation', async () => {
    getStub.withArgs('/all/v1', { params: {} }).resolves({
      data: {
        content: [
          {
            open: true,
          },
        ],
        page: {
          number: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
        },
      },
    });

    const response = await dataApiRequests.getCourts();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court details when the court by id response is valid', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const court = {
      createdAt: '2026-04-29T09:00:00Z',
      id: courtId,
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      mrdId: 'MRD-123',
      name: 'London Civil and Family Court',
      open: true,
      openOnCath: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      slug: 'london-civil-and-family-court',
      warningNotice: null,
    };

    getStub.withArgs(`/courts/${courtId}/entity/v1`).resolves({ data: court });

    const response = await dataApiRequests.getCourtById(courtId);

    expect(response).toEqual(court);
  });

  it('returns not found when the court by id endpoint returns a 404', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';

    getStub.withArgs(`/courts/${courtId}/entity/v1`).rejects(errorResponse);

    const response = await dataApiRequests.getCourtById(courtId);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when the court by id response fails schema validation', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';

    getStub.withArgs(`/courts/${courtId}/entity/v1`).resolves({
      data: {
        name: 'Incomplete Court',
      },
    });

    const response = await dataApiRequests.getCourtById(courtId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court details when the court by exact name response is valid', async () => {
    const courtName = 'London Civil and Family Court';
    const court = {
      createdAt: '2026-04-29T09:00:00Z',
      id: '55555555-5555-4555-8555-555555555555',
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      mrdId: 'MRD-123',
      name: courtName,
      open: true,
      openOnCath: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      slug: 'london-civil-and-family-court',
      warningNotice: null,
    };

    getStub.withArgs('/courts/name/v1', { params: { name: courtName } }).resolves({ data: court });

    const response = await dataApiRequests.getCourtByName(courtName);

    expect(response).toEqual(court);
  });

  it('returns not found when the court by exact name endpoint returns a 404', async () => {
    const courtName = 'London Civil and Family Court';

    getStub.withArgs('/courts/name/v1', { params: { name: courtName } }).rejects(errorResponse);

    const response = await dataApiRequests.getCourtByName(courtName);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when the court by exact name response fails schema validation', async () => {
    const courtName = 'London Civil and Family Court';

    getStub.withArgs('/courts/name/v1', { params: { name: courtName } }).resolves({
      data: {
        name: 'Incomplete Court',
      },
    });

    const response = await dataApiRequests.getCourtByName(courtName);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns internal server error when the court by exact name request fails without an axios response', async () => {
    const courtName = "King's Lynn Crown Court";

    getStub.withArgs('/courts/name/v1', { params: { name: courtName } }).rejects(errorMessage);

    const response = await dataApiRequests.getCourtByName(courtName);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court details when update court succeeds', async () => {
    const court = {
      createdAt: '2026-04-29T09:00:00Z',
      id: '55555555-5555-4555-8555-555555555555',
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      mrdId: 'MRD-123',
      name: 'Updated London Civil and Family Court',
      open: true,
      openOnCath: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      slug: 'london-civil-and-family-court',
      warningNotice: null,
    };

    putStub.withArgs(`/courts/${court.id}/v1`, court).resolves({ data: court });

    const response = await dataApiRequests.updateCourt(court);

    expect(response).toEqual(court);
  });

  it('returns parsed court details when create court succeeds', async () => {
    const payload = {
      name: 'Reading Crown Court',
      open: false,
      regionId: '33333333-3333-4333-8333-333333333333',
    };
    const court = {
      createdAt: '2026-04-29T09:00:00Z',
      id: '55555555-5555-4555-8555-555555555555',
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      mrdId: null,
      name: payload.name,
      open: true,
      openOnCath: true,
      regionId: payload.regionId,
      slug: 'reading-crown-court',
      warningNotice: null,
    };

    postStub.withArgs('/courts/v1', payload).resolves({ data: court });

    const response = await dataApiRequests.createCourt(payload);

    expect(response).toEqual(court);
    expect(postStub.firstCall.args[1]).toEqual(payload);
  });

  it('returns a validation map when create court returns a 400', async () => {
    const payload = {
      name: 'Reading Crown Court',
      open: false,
      regionId: '33333333-3333-4333-8333-333333333333',
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

    postStub.withArgs('/courts/v1', payload).rejects(badRequestError);

    const response = await dataApiRequests.createCourt(payload);

    expect(response).toEqual(new Map([['name', 'Name already exists']]));
  });

  it('returns status code when create court fails with non-400 axios error', async () => {
    const payload = {
      name: 'Reading Crown Court',
      open: false,
      regionId: '33333333-3333-4333-8333-333333333333',
    };

    postStub.withArgs('/courts/v1', payload).rejects({
      isAxiosError: true,
      response: {
        data: 'conflict',
        status: HttpStatusCode.Conflict,
      },
    });

    const response = await dataApiRequests.createCourt(payload);

    expect(response).toBe(HttpStatusCode.Conflict);
  });

  it('returns a validation map when update court returns a 400', async () => {
    const court = {
      createdAt: '2026-04-29T09:00:00Z',
      id: '55555555-5555-4555-8555-555555555555',
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      mrdId: 'MRD-123',
      name: 'Updated London Civil and Family Court',
      open: true,
      openOnCath: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      slug: 'london-civil-and-family-court',
      warningNotice: null,
    };
    const badRequestError = {
      isAxiosError: true,
      response: {
        data: {
          name: 'Name already exists',
          regionId: 'Invalid region',
        },
        status: HttpStatusCode.BadRequest,
      },
    };

    putStub.withArgs(`/courts/${court.id}/v1`, court).rejects(badRequestError);

    const response = await dataApiRequests.updateCourt(court);

    expect(response).toEqual(
      new Map([
        ['name', 'Name already exists'],
        ['regionId', 'Invalid region'],
      ])
    );
  });

  it('returns status code when update court fails with non-400 axios error', async () => {
    const court = {
      createdAt: '2026-04-29T09:00:00Z',
      id: '55555555-5555-4555-8555-555555555555',
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      mrdId: 'MRD-123',
      name: 'Updated London Civil and Family Court',
      open: true,
      openOnCath: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      slug: 'london-civil-and-family-court',
      warningNotice: null,
    };
    const conflictError = {
      isAxiosError: true,
      response: {
        data: 'conflict',
        status: HttpStatusCode.Conflict,
      },
    };

    putStub.withArgs(`/courts/${court.id}/v1`, court).rejects(conflictError);

    const response = await dataApiRequests.updateCourt(court);

    expect(response).toBe(HttpStatusCode.Conflict);
  });

  it('returns internal server error when update court response fails schema validation', async () => {
    const court = {
      createdAt: '2026-04-29T09:00:00Z',
      id: '55555555-5555-4555-8555-555555555555',
      lastUpdatedAt: '2026-04-29T10:00:00Z',
      mrdId: 'MRD-123',
      name: 'Updated London Civil and Family Court',
      open: true,
      openOnCath: true,
      regionId: '33333333-3333-4333-8333-333333333333',
      slug: 'london-civil-and-family-court',
      warningNotice: null,
    };

    putStub.withArgs(`/courts/${court.id}/v1`, court).resolves({
      data: {
        id: court.id,
        name: 'Incomplete Court',
      },
    });

    const response = await dataApiRequests.updateCourt(court);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court areas of law when the response uses java toString map keys', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const areasOfLaw = {
      'AreaOfLawType(id=66666666-6666-4666-8666-666666666666, name=Divorce, nameCy=Ysgariad, externalLink=null, externalLinkCy=null, displayName=Divorce and separation, displayNameCy=Ysgariad a gwahanu)': true,
      'AreaOfLawType(id=77777777-7777-4777-8777-777777777777, name=Probate, nameCy=Profiant, externalLink=null, externalLinkCy=null, displayName=null, displayNameCy=null)': false,
    };

    getStub.withArgs(`/courts/${courtId}/v1/areas-of-law`).resolves({ data: areasOfLaw });

    const response = await dataApiRequests.getCourtAreasOfLaw(courtId);

    expect(response).toEqual([
      {
        areaOfLawType: {
          displayName: 'Divorce and separation',
          displayNameCy: 'Ysgariad a gwahanu',
          externalLink: null,
          externalLinkCy: null,
          id: '66666666-6666-4666-8666-666666666666',
          name: 'Divorce',
          nameCy: 'Ysgariad',
        },
        selected: true,
      },
      {
        areaOfLawType: {
          displayName: null,
          displayNameCy: null,
          externalLink: null,
          externalLinkCy: null,
          id: '77777777-7777-4777-8777-777777777777',
          name: 'Probate',
          nameCy: 'Profiant',
        },
        selected: false,
      },
    ]);
  });

  it('returns not found when the court areas of law endpoint returns a 404', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';

    getStub.withArgs(`/courts/${courtId}/v1/areas-of-law`).rejects(errorResponse);

    const response = await dataApiRequests.getCourtAreasOfLaw(courtId);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when the court areas of law response fails schema validation', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';

    getStub.withArgs(`/courts/${courtId}/v1/areas-of-law`).resolves({
      data: {
        '{"name":"Divorce"}': true,
      },
    });

    const response = await dataApiRequests.getCourtAreasOfLaw(courtId);

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

    const response = await dataApiRequests.getOpeningHourTypes();

    expect(response).toEqual(openingHourTypes);
  });

  it('returns not found when fetching opening hour types fails with an axios status', async () => {
    getStub.withArgs('/types/v1/opening-hours-types').rejects(errorResponse);

    const response = await dataApiRequests.getOpeningHourTypes();

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when fetching opening hour types throws a non-axios error', async () => {
    getStub.withArgs('/types/v1/opening-hours-types').rejects(new Error('Unexpected error'));

    const response = await dataApiRequests.getOpeningHourTypes();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court opening hours when the response is valid', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const openingHours = [
      {
        id: '22222222-2222-4222-8222-222222222222',
        courtId,
        openingHourTypeId: '33333333-3333-4333-8333-333333333333',
        openingHourType: {
          id: '33333333-3333-4333-8333-333333333333',
          name: 'Court open',
          nameCy: 'Oriau agor y Llys',
        },
        openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
      },
    ];

    getStub.withArgs(`/courts/${courtId}/v1/opening-hours`).resolves({ data: openingHours, status: HttpStatusCode.Ok });

    const response = await dataApiRequests.getCourtOpeningHours(courtId);

    expect(response).toEqual(openingHours);
  });

  it('returns no content when court opening hours endpoint returns 204', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';

    getStub.withArgs(`/courts/${courtId}/v1/opening-hours`).resolves({ status: HttpStatusCode.NoContent });

    const response = await dataApiRequests.getCourtOpeningHours(courtId);

    expect(response).toBe(HttpStatusCode.NoContent);
  });

  it('returns not found when fetching court opening hours fails with an axios status', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';

    getStub.withArgs(`/courts/${courtId}/v1/opening-hours`).rejects(errorResponse);

    const response = await dataApiRequests.getCourtOpeningHours(courtId);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when court opening hours response fails schema validation', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';

    getStub.withArgs(`/courts/${courtId}/v1/opening-hours`).resolves({
      data: [{ courtId }],
      status: HttpStatusCode.Ok,
    });

    const response = await dataApiRequests.getCourtOpeningHours(courtId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court opening hours by id when the response is valid', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const openingHoursId = '22222222-2222-4222-8222-222222222222';
    const openingHours = {
      id: openingHoursId,
      courtId,
      openingHourTypeId: '33333333-3333-4333-8333-333333333333',
      openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
    };

    getStub.withArgs(`/courts/${courtId}/v1/opening-hours/${openingHoursId}`).resolves({ data: openingHours });

    const response = await dataApiRequests.getCourtOpeningHoursById(courtId, openingHoursId);

    expect(response).toEqual(openingHours);
  });

  it('returns not found when fetching court opening hours by id fails with an axios status', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const openingHoursId = '22222222-2222-4222-8222-222222222222';

    getStub.withArgs(`/courts/${courtId}/v1/opening-hours/${openingHoursId}`).rejects(errorResponse);

    const response = await dataApiRequests.getCourtOpeningHoursById(courtId, openingHoursId);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('saves court opening hours and returns the parsed response', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const payload = {
      courtId,
      openingHourTypeId: '33333333-3333-4333-8333-333333333333',
      openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
    };
    const savedOpeningHours = {
      id: '22222222-2222-4222-8222-222222222222',
      ...payload,
    };

    putStub.withArgs(`/courts/${courtId}/v1/opening-hours`, payload).resolves({ data: savedOpeningHours });

    const response = await dataApiRequests.saveCourtOpeningHours(courtId, payload);

    expect(response).toEqual(savedOpeningHours);
  });

  it('returns no content when save court opening hours succeeds without a response body', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const payload = {
      courtId,
      id: '22222222-2222-4222-8222-222222222222',
      openingHourTypeId: '33333333-3333-4333-8333-333333333333',
      openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '16:30' }],
    };

    putStub.withArgs(`/courts/${courtId}/v1/opening-hours`, payload).resolves({ status: HttpStatusCode.NoContent });

    const response = await dataApiRequests.saveCourtOpeningHours(courtId, payload);

    expect(response).toBe(HttpStatusCode.NoContent);
  });

  it('returns validation errors map when save court opening hours endpoint returns 400', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const payload = {
      courtId,
      openingHourTypeId: '',
      openingTimesDetails: [],
    };
    const apiErrors = {
      openingHourTypeId: 'Select an opening hours type',
    };

    putStub.withArgs(`/courts/${courtId}/v1/opening-hours`, payload).rejects({
      isAxiosError: true,
      response: {
        data: apiErrors,
        status: HttpStatusCode.BadRequest,
      },
    });

    const response = await dataApiRequests.saveCourtOpeningHours(courtId, payload);

    expect(response).toEqual(new Map(Object.entries(apiErrors)));
  });

  it('returns not found when save court opening hours fails with a non-400 axios status', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const payload = {
      courtId,
      openingHourTypeId: '33333333-3333-4333-8333-333333333333',
      openingTimesDetails: [],
    };

    putStub.withArgs(`/courts/${courtId}/v1/opening-hours`, payload).rejects(errorResponse);

    const response = await dataApiRequests.saveCourtOpeningHours(courtId, payload);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns delete status when delete court opening hours succeeds', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const openingHoursId = '22222222-2222-4222-8222-222222222222';

    deleteStub
      .withArgs(`/courts/${courtId}/v1/opening-hours/${openingHoursId}`)
      .resolves({ status: HttpStatusCode.NoContent });

    const response = await dataApiRequests.deleteCourtOpeningHours(courtId, openingHoursId);

    expect(response).toBe(HttpStatusCode.NoContent);
  });

  it('returns not found when delete court opening hours fails with an axios status', async () => {
    const courtId = '11111111-1111-4111-8111-111111111111';
    const openingHoursId = '22222222-2222-4222-8222-222222222222';

    deleteStub.withArgs(`/courts/${courtId}/v1/opening-hours/${openingHoursId}`).rejects(errorResponse);

    const response = await dataApiRequests.deleteCourtOpeningHours(courtId, openingHoursId);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns ok when court areas of law are updated successfully', async () => {
    const payload = {
      areasOfLaw: ['66666666-6666-4666-8666-666666666666'],
      courtId: '55555555-5555-4555-8555-555555555555',
    };

    putStub
      .withArgs('/courts/55555555-5555-4555-8555-555555555555/v1/areas-of-law', payload)
      .resolves({ status: HttpStatusCode.Ok });

    const response = await dataApiRequests.updateCourtAreasOfLaw(payload);

    expect(response).toBe(HttpStatusCode.Ok);
  });

  it('returns bad request when updating court areas of law fails', async () => {
    const payload = {
      areasOfLaw: ['66666666-6666-4666-8666-666666666666'],
      courtId: '55555555-5555-4555-8555-555555555555',
    };
    const badRequestError = {
      isAxiosError: true,
      response: {
        data: 'bad request',
        status: 400,
      },
    };

    putStub.withArgs('/courts/55555555-5555-4555-8555-555555555555/v1/areas-of-law', payload).rejects(badRequestError);

    const response = await dataApiRequests.updateCourtAreasOfLaw(payload);

    expect(response).toBe(HttpStatusCode.BadRequest);
  });

  it('returns parsed location details when the bulk location response is valid', async () => {
    const allCourts = [
      {
        id: '55555555-5555-4555-8555-555555555555',
        name: 'London Civil and Family Court',
        slug: 'london-civil-and-family-court',
        open: true,
        warningNotice: null,
        lastUpdatedAt: '2026-04-29T10:00:00Z',
        openOnCath: true,
        mrdId: 'MRD-123',
        region: {
          name: 'London',
          country: 'England',
        },
        courtDxCodes: [
          {
            dxCode: 'DX 123',
            explanation: null,
          },
        ],
        courtCodes: [
          {
            magistrateCourtCode: null,
            familyCourtCode: 123,
            tribunalCode: null,
            countyCourtCode: 456,
            crownCourtCode: null,
            gbs: null,
          },
        ],
        courtFaxNumbers: [
          {
            faxNumber: '01234 567890',
            description: null,
          },
        ],
        courtAddresses: [
          {
            id: '66666666-6666-4666-8666-666666666666',
            courtId: '55555555-5555-4555-8555-555555555555',
            addressLine1: '1 High Street',
            addressLine2: null,
            townCity: 'London',
            county: null,
            postcode: 'SW1A 1AA',
            epimId: null,
            lat: 51.501,
            lon: -0.141,
            addressType: 'VISIT_US',
            areasOfLaw: [
              {
                id: '67676767-6666-7666-7666-666666666666',
                name: 'Divorce',
                nameCy: 'Ysgariad',
                externalLink: null,
                externalLinkCy: null,
                displayName: null,
                displayNameCy: null,
              },
            ],
            courtTypes: [
              {
                id: '77777777-7777-4777-8777-777777777777',
                name: 'Crown Court',
              },
            ],
          },
        ],
        courtOpeningHours: [
          {
            openingTimesDetails: [
              {
                dayOfWeek: 'MONDAY',
                openingTime: '09:00',
                closingTime: '17:00',
              },
            ],
            openingHourType: {
              name: 'Building',
              nameCy: 'Adeilad',
            },
          },
        ],
        courtCounterServiceOpeningHours: [
          {
            counterService: true,
            assistWithForms: false,
            assistWithDocuments: false,
            assistWithSupport: false,
            appointmentNeeded: false,
            appointmentContact: null,
            openingTimesDetails: [
              {
                dayOfWeek: 'MONDAY',
                openingTime: '09:00',
                closingTime: '17:00',
              },
            ],
            courtTypes: [],
          },
        ],
        courtContactDetails: [
          {
            courtContactDescriptionId: '66666666-6666-4666-8666-666666666666',
            explanation: null,
            explanationCy: null,
            email: 'court@example.com',
            phoneNumber: '01234 567890',
            courtContactDescription: {
              name: 'Enquiries',
              nameCy: 'Ymholiadau',
            },
          },
        ],
        courtTranslations: [
          {
            email: 'translations@example.com',
            phoneNumber: '01234 567891',
          },
        ],
        courtAccessibilityOptions: [
          {
            accessibleParking: true,
            accessibleParkingPhoneNumber: null,
            accessibleToiletDescription: null,
            accessibleToiletDescriptionCy: null,
            accessibleEntrance: true,
            accessibleEntrancePhoneNumber: null,
            hearingEnhancementEquipment: 'HEARING_LOOP_SYSTEMS',
            lift: true,
            liftDoorWidth: null,
            liftDoorLimit: null,
            quietRoom: false,
          },
        ],
        courtFacilities: [
          {
            parking: true,
            freeWaterDispensers: false,
            snackVendingMachines: false,
            drinkVendingMachines: false,
            cafeteria: false,
            waitingArea: true,
            waitingAreaChildren: null,
            quietRoom: false,
            babyChanging: false,
            wifi: true,
          },
        ],
        courtProfessionalInformation: [
          {
            interviewRooms: true,
            interviewRoomCount: 2,
            interviewPhoneNumber: null,
            videoHearings: true,
            commonPlatform: false,
            accessScheme: false,
          },
        ],
        courtAreasOfLaw: [
          {
            areasOfLaw: [
              {
                id: '67676767-6666-7666-7666-666666666666',
                name: 'Divorce',
                nameCy: 'Ysgariad',
                externalLink: null,
                externalLinkCy: null,
                displayName: null,
                displayNameCy: null,
              },
              '77777777-7777-4777-8777-777777777777',
            ],
          },
        ],
        courtPhotos: [
          {
            fileLink: 'https://example.com/photo.jpg',
            lastUpdatedAt: '2026-04-29T10:00:00Z',
          },
        ],
      },
    ];

    const allLocations = [
      {
        locationType: 'COURT',
        serviceCentre: false,
        court: allCourts[0],
        serviceCentreDetails: null,
      },
      {
        locationType: 'SERVICE_CENTRE',
        serviceCentre: true,
        court: null,
        serviceCentreDetails: {
          id: '88888888-8888-4888-8888-888888888888',
          name: 'National Business Centre',
          slug: 'national-business-centre',
          open: true,
          warningNotice: null,
          createdAt: '2026-04-29T09:00:00Z',
          lastUpdatedAt: '2026-04-29T10:00:00Z',
          serviceAreas: [
            {
              id: '99999999-9999-4999-8999-999999999999',
              name: 'Family',
              nameCy: 'Teulu',
            },
            '10101010-1010-4010-8010-101010101010',
          ],
          catchmentType: 'NATIONAL',
          serviceCentreAddresses: [],
          serviceCentreContactDetails: [],
          serviceCentreAreasOfLaw: [
            {
              areasOfLaw: ['11111111-1111-4111-8111-111111111111'],
            },
          ],
        },
      },
    ];

    getStub.withArgs('/all/details/v1').resolves({ data: allLocations });

    const response = await dataApiRequests.getAllLocations();

    expect(response).toEqual([
      {
        ...allLocations[0],
        court: {
          ...allCourts[0],
          courtFacilities: [
            {
              ...allCourts[0].courtFacilities[0],
              waitingArea: true,
              waitingAreaChildren: false,
            },
          ],
        },
      },
      {
        ...allLocations[1],
      },
    ]);
  });

  it('returns bad request when the bulk location endpoint returns a 400', async () => {
    const badRequestError = {
      isAxiosError: true,
      response: {
        data: 'bad request',
        status: 400,
      },
    };

    getStub.withArgs('/all/details/v1').rejects(badRequestError);

    const response = await dataApiRequests.getAllLocations();

    expect(response).toBe(HttpStatusCode.BadRequest);
  });

  it('returns internal server error when the bulk location response fails schema validation', async () => {
    getStub.withArgs('/all/details/v1').resolves({
      data: [
        {
          name: 'Incomplete court',
        },
      ],
    });

    const response = await dataApiRequests.getAllLocations();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns the user entity when create/update user succeeds', async () => {
    const user = {
      email: 'user@justice.gov.uk',
      ssoId: '00000000-0000-0000-0000-000000000000',
      role: 'Admin' as const,
    };
    const userEntity = {
      email: 'user@justice.gov.uk',
      favouriteCourts: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      lastLogin: '2026-05-27T10:35:23.406Z',
      role: 'ADMIN',
      ssoId: '00000000-0000-0000-0000-000000000000',
    };

    postStub.withArgs('/user/v1', user).resolves({ data: userEntity });

    const response = await dataApiRequests.createUpdateUser(user);

    expect(response).toEqual(userEntity);
  });

  it('returns the user entity when create/update user response has no favourite courts', async () => {
    const user = {
      email: 'user@justice.gov.uk',
      ssoId: '00000000-0000-0000-0000-000000000000',
      role: 'Admin' as const,
    };
    const userEntity = {
      email: 'user@justice.gov.uk',
      favouriteCourts: null,
      id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      lastLogin: '2026-05-27T10:35:23.406Z',
      role: 'ADMIN',
      ssoId: '00000000-0000-0000-0000-000000000000',
    };

    postStub.withArgs('/user/v1', user).resolves({ data: userEntity });

    const response = await dataApiRequests.createUpdateUser(user);

    expect(response).toEqual(userEntity);
  });

  it('returns internal server error when create/update user response fails schema validation', async () => {
    const user = {
      email: 'user@justice.gov.uk',
      ssoId: '00000000-0000-0000-0000-000000000000',
      role: 'Admin' as const,
    };

    postStub.withArgs('/user/v1', user).resolves({
      data: {
        email: 'not-an-email',
      },
    });

    const response = await dataApiRequests.createUpdateUser(user);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns the API status when create/update user fails with an axios response', async () => {
    const user = {
      email: 'user@justice.gov.uk',
      ssoId: '00000000-0000-0000-0000-000000000000',
      role: 'Admin' as const,
    };

    postStub.withArgs('/user/v1', user).rejects(errorResponse);

    const response = await dataApiRequests.createUpdateUser(user);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when create/update user fails without an axios response', async () => {
    const user = {
      email: 'user@justice.gov.uk',
      ssoId: '00000000-0000-0000-0000-000000000000',
      role: 'Admin' as const,
    };

    postStub.withArgs('/user/v1', user).rejects(errorMessage);

    const response = await dataApiRequests.createUpdateUser(user);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court address details when the address list response is valid', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addresses = [
      {
        id: '88888888-8888-4888-8888-888888888888',
        courtId,
        addressLine1: '1 High Street',
        addressLine2: null,
        townCity: 'London',
        county: null,
        postcode: 'SW1A 1AA',
        epimId: null,
        lat: 51.5,
        lon: -0.14,
        addressType: 'VISIT_US',
        areasOfLaw: null,
        courtTypes: null,
      },
    ];

    getStub.withArgs(`/courts/${courtId}/v1/address`).resolves({ data: addresses });

    const response = await dataApiRequests.getCourtAddressDetails(courtId);

    expect(response).toEqual(addresses);
  });

  it('returns unauthorized when address list endpoint returns a 401', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';

    getStub.withArgs(`/courts/${courtId}/v1/address`).rejects({
      isAxiosError: true,
      response: {
        data: 'unauthorized',
        status: 401,
      },
    });

    const response = await dataApiRequests.getCourtAddressDetails(courtId);

    expect(response).toBe(HttpStatusCode.Unauthorized);
  });

  it('returns internal server error when address list response fails schema validation', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';

    getStub.withArgs(`/courts/${courtId}/v1/address`).resolves({
      data: [{ addressLine1: 'Missing required fields' }],
    });

    const response = await dataApiRequests.getCourtAddressDetails(courtId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court address details by id when the response is valid', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addressId = '88888888-8888-4888-8888-888888888888';
    const address = {
      id: addressId,
      courtId,
      addressLine1: '1 High Street',
      addressLine2: null,
      townCity: 'London',
      county: null,
      postcode: 'SW1A 1AA',
      epimId: null,
      lat: 51.5,
      lon: -0.14,
      addressType: 'VISIT_US',
      areasOfLaw: null,
      courtTypes: null,
    };

    getStub.withArgs(`/courts/${courtId}/v1/address/${addressId}`).resolves({ data: address });

    const response = await dataApiRequests.getCourtAddressDetailsById(courtId, addressId);

    expect(response).toEqual(address);
  });

  it('returns internal server error when court address by id response fails schema validation', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addressId = '88888888-8888-4888-8888-888888888888';

    getStub.withArgs(`/courts/${courtId}/v1/address/${addressId}`).resolves({
      data: {
        addressLine1: 'Missing required fields',
      },
    });

    const response = await dataApiRequests.getCourtAddressDetailsById(courtId, addressId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns not found when address by id endpoint returns a 404', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addressId = '88888888-8888-4888-8888-888888888888';

    getStub.withArgs(`/courts/${courtId}/v1/address/${addressId}`).rejects(errorResponse);

    const response = await dataApiRequests.getCourtAddressDetailsById(courtId, addressId);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns forbidden when save court address endpoint returns a non-400 axios error', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const payload = { addressLine1: 'some address' };

    postStub.withArgs(`/courts/${courtId}/v1/address`, payload).rejects({
      isAxiosError: true,
      response: {
        data: 'forbidden',
        status: 403,
      },
    });

    const response = await dataApiRequests.saveCourtAddress(payload, courtId);

    expect(response).toBe(HttpStatusCode.Forbidden);
  });

  it('returns parsed saved address when save court address response is valid', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const payload = {
      addressLine1: '10 Downing Street',
      addressLine2: null,
      townCity: 'London',
      county: null,
      postcode: 'SW1A 2AA',
      epimId: null,
      lat: 51.503,
      lon: -0.127,
      addressType: 'WRITE_TO_US' as const,
      areasOfLaw: null,
      courtTypes: null,
    };
    const savedAddress = {
      id: '88888888-8888-4888-8888-888888888888',
      courtId,
      ...payload,
    };

    postStub.withArgs(`/courts/${courtId}/v1/address`, payload).resolves({ data: savedAddress });

    const response = await dataApiRequests.saveCourtAddress(payload, courtId);

    expect(response).toEqual(savedAddress);
  });

  it('returns validation errors map when save court address endpoint returns a 400', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const payload = { addressLine1: '' };
    const apiErrors = {
      addressLine1: 'Address line 1 is required',
      postcode: 'Invalid postcode',
    };

    postStub.withArgs(`/courts/${courtId}/v1/address`, payload).rejects({
      isAxiosError: true,
      response: {
        data: apiErrors,
        status: 400,
      },
    });

    const response = await dataApiRequests.saveCourtAddress(payload, courtId);

    expect(response).toEqual(new Map(Object.entries(apiErrors)));
  });

  it('returns internal server error when save court address throws a non-axios error', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const payload = { addressLine1: 'some address' };

    postStub.withArgs(`/courts/${courtId}/v1/address`, payload).rejects(new Error('Unexpected error'));

    const response = await dataApiRequests.saveCourtAddress(payload, courtId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns conflict when update court address endpoint returns a non-400 axios error', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addressId = '88888888-8888-4888-8888-888888888888';
    const payload = { postcode: 'M1 1AA' };

    putStub.withArgs(`/courts/${courtId}/v1/address/${addressId}`, payload).rejects({
      isAxiosError: true,
      response: {
        data: 'conflict',
        status: 409,
      },
    });

    const response = await dataApiRequests.updateCourtAddress(payload, courtId, addressId);

    expect(response).toBe(HttpStatusCode.Conflict);
  });

  it('returns internal server error when update court address throws a non-axios error', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addressId = '88888888-8888-4888-8888-888888888888';
    const payload = { postcode: 'M1 1AA' };

    putStub.withArgs(`/courts/${courtId}/v1/address/${addressId}`, payload).rejects(new Error('Unexpected error'));

    const response = await dataApiRequests.updateCourtAddress(payload, courtId, addressId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed updated address when update court address response is valid', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addressId = '88888888-8888-4888-8888-888888888888';
    const payload = {
      addressLine1: 'Updated address line 1',
      addressType: 'VISIT_OR_CONTACT_US' as const,
      townCity: 'Manchester',
      postcode: 'M1 1AA',
    };
    const updatedAddress = {
      id: addressId,
      courtId,
      addressLine1: payload.addressLine1,
      addressLine2: null,
      townCity: payload.townCity,
      county: null,
      postcode: payload.postcode,
      epimId: null,
      lat: null,
      lon: null,
      addressType: payload.addressType,
      areasOfLaw: null,
      courtTypes: null,
    };

    putStub.withArgs(`/courts/${courtId}/v1/address/${addressId}`, payload).resolves({ data: updatedAddress });

    const response = await dataApiRequests.updateCourtAddress(payload, courtId, addressId);

    expect(response).toEqual(updatedAddress);
  });

  it('returns validation errors map when update court address endpoint returns a 400', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addressId = '88888888-8888-4888-8888-888888888888';
    const payload = { postcode: 'bad' };
    const apiErrors = {
      postcode: 'Invalid postcode',
    };

    putStub.withArgs(`/courts/${courtId}/v1/address/${addressId}`, payload).rejects({
      isAxiosError: true,
      response: {
        data: apiErrors,
        status: 400,
      },
    });

    const response = await dataApiRequests.updateCourtAddress(payload, courtId, addressId);

    expect(response).toEqual(new Map(Object.entries(apiErrors)));
  });

  it('returns no content when delete court address succeeds', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addressId = '88888888-8888-4888-8888-888888888888';

    deleteStub.withArgs(`/courts/${courtId}/v1/address/${addressId}`).resolves({ status: HttpStatusCode.NoContent });

    const response = await dataApiRequests.deleteCourtAddress(courtId, addressId);

    expect(response).toBe(HttpStatusCode.NoContent);
  });

  it('returns internal server error when delete court address returns an unexpected status', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addressId = '88888888-8888-4888-8888-888888888888';

    deleteStub.withArgs(`/courts/${courtId}/v1/address/${addressId}`).resolves({ status: HttpStatusCode.Ok });

    const response = await dataApiRequests.deleteCourtAddress(courtId, addressId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns gone when delete court address endpoint errors with gone status', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addressId = '88888888-8888-4888-8888-888888888888';

    deleteStub.withArgs(`/courts/${courtId}/v1/address/${addressId}`).rejects({
      isAxiosError: true,
      response: {
        data: 'gone',
        status: 410,
      },
    });

    const response = await dataApiRequests.deleteCourtAddress(courtId, addressId);

    expect(response).toBe(HttpStatusCode.Gone);
  });

  it('returns internal server error when delete court address throws a non-axios error', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const addressId = '88888888-8888-4888-8888-888888888888';

    deleteStub.withArgs(`/courts/${courtId}/v1/address/${addressId}`).rejects(new Error('Unexpected error'));

    const response = await dataApiRequests.deleteCourtAddress(courtId, addressId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns not found when postcode search endpoint returns a non-400 axios error', async () => {
    const postcode = 'SW1A1ZZ';

    getStub.withArgs(`/search/address/v1/postcode/${postcode}`).rejects(errorResponse);

    const response = await dataApiRequests.getAddressesForPostcode(postcode);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when postcode search throws a non-axios error', async () => {
    const postcode = 'SW1A1ZZ';

    getStub.withArgs(`/search/address/v1/postcode/${postcode}`).rejects(new Error('Unexpected error'));

    const response = await dataApiRequests.getAddressesForPostcode(postcode);

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

    const response = await dataApiRequests.getAddressesForPostcode(postcode);

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

    const response = await dataApiRequests.getAddressesForPostcode(postcode);

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

    const response = await dataApiRequests.getAreasOfLaw();

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

    const response = await dataApiRequests.getAreasOfLaw();

    expect(response).toEqual(areasOfLaw);
  });

  it('returns internal server error when areas of law response fails schema validation', async () => {
    getStub.withArgs('/types/v1/areas-of-law').resolves({
      data: [{ name: 'Missing required fields' }],
    });

    const response = await dataApiRequests.getAreasOfLaw();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court types when response is valid', async () => {
    const courtTypes = [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        name: 'County Court',
      },
    ];

    getStub.withArgs('/types/v1/court-types').resolves({ data: courtTypes });

    const response = await dataApiRequests.getCourtTypes();

    expect(response).toEqual(courtTypes);
  });

  it('returns internal server error when court types response fails schema validation', async () => {
    getStub.withArgs('/types/v1/court-types').resolves({
      data: [{ name: 'Missing required fields' }],
    });

    const response = await dataApiRequests.getCourtTypes();

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

    const response = await dataApiRequests.getCourtTypes();

    expect(response).toBe(HttpStatusCode.Unauthorized);
  });

  it('returns parsed contact description types when response is valid', async () => {
    const contactDescriptionTypes = [
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Enquiries',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Listing enquiries',
      },
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'General enquiries',
      },
    ];

    getStub.withArgs('/types/v1/contact-description-types').resolves({ data: contactDescriptionTypes });

    const response = await dataApiRequests.getContactDescriptionTypes();

    expect(response).toEqual([
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Enquiries',
      },
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'General enquiries',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Listing enquiries',
      },
    ]);
  });

  it('returns internal server error when contact description types response fails schema validation', async () => {
    getStub.withArgs('/types/v1/contact-description-types').resolves({
      data: [{ name: 'Missing id' }],
    });

    const response = await dataApiRequests.getContactDescriptionTypes();

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

    const response = await dataApiRequests.getContactDescriptionTypes();

    expect(response).toBe(HttpStatusCode.ServiceUnavailable);
  });

  it('returns parsed translation services when the response is valid', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const translationServices = {
      courtId,
      email: 'translations@example.com',
      id: '66666666-6666-4666-8666-666666666666',
      phoneNumber: '+441234 567890',
    };

    getStub.withArgs(`/courts/${courtId}/v1/translation-services`).resolves({
      data: translationServices,
      status: HttpStatusCode.Ok,
    });

    const response = await dataApiRequests.getTranslationServices(courtId);

    expect(response).toEqual(translationServices);
  });

  it('returns null when translation services do not exist for the court', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';

    getStub.withArgs(`/courts/${courtId}/v1/translation-services`).resolves({
      status: HttpStatusCode.NoContent,
    });

    const response = await dataApiRequests.getTranslationServices(courtId);

    expect(response).toBeNull();
  });

  it('returns not found when the translation services endpoint returns a 404', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';

    getStub.withArgs(`/courts/${courtId}/v1/translation-services`).rejects(errorResponse);

    const response = await dataApiRequests.getTranslationServices(courtId);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('posts translation services payload and returns the parsed response', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const payload = {
      courtId,
      email: 'translations@example.com',
      phoneNumber: '+441234 567890',
    };

    postStub.withArgs(`/courts/${courtId}/v1/translation-services`, payload).resolves({
      data: {
        ...payload,
        id: '66666666-6666-4666-8666-666666666666',
      },
      status: HttpStatusCode.Created,
    });

    const response = await dataApiRequests.saveTranslationServices(courtId, payload);

    expect(response).toEqual({
      ...payload,
      id: '66666666-6666-4666-8666-666666666666',
    });
  });

  it('returns no content when saving translation services succeeds without a response body', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const payload = {
      courtId,
      email: '',
      phoneNumber: '',
    };

    postStub.withArgs(`/courts/${courtId}/v1/translation-services`, payload).resolves({
      status: HttpStatusCode.NoContent,
    });

    const response = await dataApiRequests.saveTranslationServices(courtId, payload);

    expect(response).toBe(HttpStatusCode.NoContent);
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

    const response = await dataApiRequests.getLocalAuthorities();

    expect(response).toEqual(localAuthorities);
  });

  it('returns internal server error when local authorities response fails schema validation', async () => {
    getStub.withArgs('/types/v1/local-authorities').resolves({
      data: [{ name: 'Missing required fields' }],
    });

    const response = await dataApiRequests.getLocalAuthorities();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court local authorities when response is valid', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const localAuthorities = [
      {
        areaOfLawId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        areaOfLawName: 'Children',
        localAuthorities: [
          {
            id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
            name: 'Local Authority A',
            selected: true,
          },
        ],
      },
    ];

    getStub.withArgs(`/courts/${courtId}/v1/local-authorities`).resolves({ data: localAuthorities });

    const response = await dataApiRequests.getCourtLocalAuthorities(courtId);

    expect(response).toEqual(localAuthorities);
  });

  it('returns not found when court local authorities endpoint returns a 404', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

    getStub.withArgs(`/courts/${courtId}/v1/local-authorities`).rejects(errorResponse);

    const response = await dataApiRequests.getCourtLocalAuthorities(courtId);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when court local authorities response fails schema validation', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

    getStub.withArgs(`/courts/${courtId}/v1/local-authorities`).resolves({
      data: [{ areaOfLawName: 'Children' }],
    });

    const response = await dataApiRequests.getCourtLocalAuthorities(courtId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns ok when court local authorities are updated successfully', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const payload = [
      {
        areaOfLawId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        areaOfLawName: 'Children',
        localAuthorities: [
          {
            id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
            selected: true,
          },
        ],
      },
    ];

    putStub.withArgs(`/courts/${courtId}/v1/local-authorities`, payload).resolves({ status: HttpStatusCode.Ok });

    const response = await dataApiRequests.updateCourtLocalAuthorities(courtId, payload);

    expect(response).toBe(HttpStatusCode.Ok);
  });

  it('returns validation errors map when update court local authorities endpoint returns a 400', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const payload = [
      {
        areaOfLawId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        localAuthorities: [],
      },
    ];
    const apiErrors = {
      Children: 'At least one local authority must be selected',
    };

    putStub.withArgs(`/courts/${courtId}/v1/local-authorities`, payload).rejects({
      isAxiosError: true,
      response: {
        data: apiErrors,
        status: 400,
      },
    });

    const response = await dataApiRequests.updateCourtLocalAuthorities(courtId, payload);

    expect(response).toEqual(new Map(Object.entries(apiErrors)));
  });

  it('returns internal server error when update court local authorities throws a non-axios error', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const payload = [
      {
        areaOfLawId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        localAuthorities: [],
      },
    ];

    putStub.withArgs(`/courts/${courtId}/v1/local-authorities`, payload).rejects(new Error('Unexpected error'));

    const response = await dataApiRequests.updateCourtLocalAuthorities(courtId, payload);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court single point of entry when response is valid', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const singlePointOfEntry = [
      {
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        name: 'Children',
        nameCy: 'Plant',
        selected: true,
      },
    ];

    getStub.withArgs(`/courts/${courtId}/v1/single-point-of-entry`).resolves({ data: singlePointOfEntry });

    const response = await dataApiRequests.getCourtSinglePointOfEntry(courtId);

    expect(response).toEqual(singlePointOfEntry);
  });

  it('returns not found when court single point of entry endpoint returns a 404', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

    getStub.withArgs(`/courts/${courtId}/v1/single-point-of-entry`).rejects(errorResponse);

    const response = await dataApiRequests.getCourtSinglePointOfEntry(courtId);

    expect(response).toBe(HttpStatusCode.NotFound);
  });

  it('returns internal server error when court single point of entry response fails schema validation', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

    getStub.withArgs(`/courts/${courtId}/v1/single-point-of-entry`).resolves({
      data: [{ name: 'Children' }],
    });

    const response = await dataApiRequests.getCourtSinglePointOfEntry(courtId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns ok when court single point of entry is updated successfully', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const payload = [
      {
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        name: 'Children',
        selected: true,
      },
    ];

    putStub.withArgs(`/courts/${courtId}/v1/single-point-of-entry`, payload).resolves({ status: HttpStatusCode.Ok });

    const response = await dataApiRequests.updateCourtSinglePointOfEntry(courtId, payload);

    expect(response).toBe(HttpStatusCode.Ok);
  });

  it('returns validation errors map when update court single point of entry endpoint returns a 400', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const payload = [
      {
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        name: 'Children',
        selected: true,
      },
    ];
    const apiErrors = {
      Children: 'Invalid single point of entry setting',
    };

    putStub.withArgs(`/courts/${courtId}/v1/single-point-of-entry`, payload).rejects({
      isAxiosError: true,
      response: {
        data: apiErrors,
        status: 400,
      },
    });

    const response = await dataApiRequests.updateCourtSinglePointOfEntry(courtId, payload);

    expect(response).toEqual(new Map(Object.entries(apiErrors)));
  });

  it('returns internal server error when update court single point of entry throws a non-axios error', async () => {
    const courtId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const payload = [
      {
        id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        name: 'Children',
        selected: true,
      },
    ];

    putStub.withArgs(`/courts/${courtId}/v1/single-point-of-entry`, payload).rejects(new Error('Unexpected error'));

    const response = await dataApiRequests.updateCourtSinglePointOfEntry(courtId, payload);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed court professional information when response is valid', async () => {
    const courtId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    const professionalInformation = {
      professionalInformation: {
        interviewRooms: true,
        videoHearings: true,
        commonPlatform: false,
        accessScheme: true,
        interviewRoomCount: 3,
        interviewPhoneNumber: '01234 567890',
      },
      codes: {
        countyCourtCode: 101,
        crownCourtCode: null,
        familyCourtCode: 202,
        gbs: null,
        magistrateCourtCode: null,
        tribunalCode: null,
      },
      dxCodes: [
        {
          dxCode: 'DX 999',
          explanation: null,
        },
      ],
      faxNumbers: [
        {
          faxNumber: '020 0000 0000',
          description: 'Main fax',
        },
      ],
    };

    getStub.withArgs(`/courts/${courtId}/v1/professional-information`).resolves({ data: professionalInformation });

    const response = await dataApiRequests.getCourtProfessionalInformation(courtId);

    expect(response).toEqual(professionalInformation);
  });

  it('returns null when court professional information endpoint returns no content', async () => {
    const courtId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

    getStub.withArgs(`/courts/${courtId}/v1/professional-information`).resolves({ status: HttpStatusCode.NoContent });

    const response = await dataApiRequests.getCourtProfessionalInformation(courtId);

    expect(response).toBeNull();
  });

  it('posts court professional information', async () => {
    const courtId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
    const professionalInformation = {
      professionalInformation: {
        interviewRooms: true,
        videoHearings: true,
        commonPlatform: false,
        accessScheme: true,
        interviewRoomCount: 3,
        interviewPhoneNumber: '01234 567890',
      },
      codes: {
        countyCourtCode: 101,
        crownCourtCode: null,
        familyCourtCode: 202,
        gbs: null,
        magistrateCourtCode: null,
        tribunalCode: null,
      },
      dxCodes: [
        {
          dxCode: 'DX 999',
          explanation: null,
        },
      ],
      faxNumbers: [
        {
          faxNumber: '020 0000 0000',
          description: 'Main fax',
        },
      ],
    };

    postStub
      .withArgs(`/courts/${courtId}/v1/professional-information`, professionalInformation)
      .resolves({ data: professionalInformation });

    const response = await dataApiRequests.saveCourtProfessionalInformation(courtId, professionalInformation);

    expect(response).toEqual(professionalInformation);
  });

  it('returns forbidden when court professional information endpoint returns a 403', async () => {
    const courtId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

    getStub.withArgs(`/courts/${courtId}/v1/professional-information`).rejects({
      isAxiosError: true,
      response: {
        data: 'forbidden',
        status: 403,
      },
    });

    const response = await dataApiRequests.getCourtProfessionalInformation(courtId);

    expect(response).toBe(HttpStatusCode.Forbidden);
  });

  it('returns internal server error when court professional information response fails schema validation', async () => {
    const courtId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

    getStub.withArgs(`/courts/${courtId}/v1/professional-information`).resolves({
      data: {
        professionalInformation: {
          interviewRooms: true,
        },
      },
    });

    const response = await dataApiRequests.getCourtProfessionalInformation(courtId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed building facilities when the response is valid', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const buildingFacilities = {
      id: '66666666-6666-4666-8666-666666666666',
      courtId,
      parking: true,
      freeWaterDispensers: false,
      snackVendingMachines: false,
      drinkVendingMachines: false,
      cafeteria: false,
      waitingArea: true,
      waitingAreaChildren: false,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
    };

    getStub.withArgs(`/courts/${courtId}/v1/building-facilities`).resolves({
      data: buildingFacilities,
      status: HttpStatusCode.Ok,
    });

    const response = await dataApiRequests.getBuildingFacilities(courtId);

    expect(response).toEqual(buildingFacilities);
  });

  it('returns null when building facilities do not exist for the court', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';

    getStub.withArgs(`/courts/${courtId}/v1/building-facilities`).resolves({
      status: HttpStatusCode.NoContent,
    });

    const response = await dataApiRequests.getBuildingFacilities(courtId);

    expect(response).toBeNull();
  });

  it('returns internal server error when building facilities response fails schema validation', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';

    getStub.withArgs(`/courts/${courtId}/v1/building-facilities`).resolves({
      data: {
        id: '66666666-6666-4666-8666-666666666666',
        courtId,
      },
      status: HttpStatusCode.Ok,
    });

    const response = await dataApiRequests.getBuildingFacilities(courtId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('posts building facilities payload and returns parsed response', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const payload = {
      courtId,
      parking: true,
      freeWaterDispensers: false,
      snackVendingMachines: false,
      drinkVendingMachines: false,
      cafeteria: false,
      waitingArea: true,
      waitingAreaChildren: false,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
    };
    const responseBody = {
      id: '66666666-6666-4666-8666-666666666666',
      ...payload,
    };

    postStub.withArgs(`/courts/${courtId}/v1/building-facilities`, payload).resolves({
      data: responseBody,
      status: HttpStatusCode.Ok,
    });

    const response = await dataApiRequests.updateBuildingFacilities(courtId, payload);

    expect(response).toEqual(responseBody);
  });

  it('returns validation errors map when update building facilities endpoint returns a 400', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const payload = {
      courtId,
      parking: true,
      freeWaterDispensers: false,
      snackVendingMachines: false,
      drinkVendingMachines: false,
      cafeteria: false,
      waitingArea: true,
      waitingAreaChildren: false,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
    };
    const apiErrors = {
      waitingArea: 'Select whether the waiting area is available',
    };

    postStub.withArgs(`/courts/${courtId}/v1/building-facilities`, payload).rejects({
      isAxiosError: true,
      response: {
        data: apiErrors,
        status: HttpStatusCode.BadRequest,
      },
    });

    const response = await dataApiRequests.updateBuildingFacilities(courtId, payload);

    expect(response).toEqual(new Map(Object.entries(apiErrors)));
  });

  it('returns internal server error when update building facilities throws a non-axios error', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const payload = {
      courtId,
      parking: true,
      freeWaterDispensers: false,
      snackVendingMachines: false,
      drinkVendingMachines: false,
      cafeteria: false,
      waitingArea: true,
      waitingAreaChildren: false,
      quietRoom: false,
      babyChanging: false,
      wifi: true,
    };

    postStub.withArgs(`/courts/${courtId}/v1/building-facilities`, payload).rejects(new Error('Unexpected error'));

    const response = await dataApiRequests.updateBuildingFacilities(courtId, payload);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('returns parsed accessibility options when the response is valid', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const accessibility = {
      id: '66666666-6666-4666-8666-666666666666',
      courtId,
      accessibleParking: true,
      accessibleEntrance: true,
      hearingEnhancementEquipment: 'INFRARED_SYSTEMS',
      lift: false,
      quietRoom: true,
    };

    getStub.withArgs(`/courts/${courtId}/v1/accessibility-options`).resolves({
      data: accessibility,
      status: HttpStatusCode.Ok,
    });

    const response = await dataApiRequests.getAccessibility(courtId);

    expect(response).toEqual(
      expect.objectContaining({
        id: accessibility.id,
        courtId,
        hearingEnhancementEquipment: 'infrared',
      })
    );
  });

  it('returns null when accessibility options do not exist for the court', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';

    getStub.withArgs(`/courts/${courtId}/v1/accessibility-options`).resolves({
      status: HttpStatusCode.NoContent,
    });

    const response = await dataApiRequests.getAccessibility(courtId);

    expect(response).toBeNull();
  });

  it('returns internal server error when accessibility response fails schema validation', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';

    getStub.withArgs(`/courts/${courtId}/v1/accessibility-options`).resolves({
      data: {
        id: '66666666-6666-4666-8666-666666666666',
        courtId,
        hearingEnhancementEquipment: 'INVALID_ENUM',
      },
      status: HttpStatusCode.Ok,
    });

    const response = await dataApiRequests.getAccessibility(courtId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('posts accessibility payload and returns parsed response', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const payload = {
      courtId,
      accessibleParking: true,
      accessibleEntrance: true,
      hearingEnhancementEquipment: 'INFRARED_SYSTEMS' as const,
      lift: false,
      quietRoom: true,
    };

    postStub.withArgs(`/courts/${courtId}/v1/accessibility-options`, payload).resolves({
      data: {
        id: '66666666-6666-4666-8666-666666666666',
        ...payload,
      },
      status: HttpStatusCode.Ok,
    });

    const response = await dataApiRequests.updateAccessibility(courtId, payload);

    expect(response).toEqual(
      expect.objectContaining({
        id: '66666666-6666-4666-8666-666666666666',
        courtId,
        hearingEnhancementEquipment: 'infrared',
      })
    );
  });

  it('returns validation errors map when update accessibility endpoint returns a 400', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const payload = {
      courtId,
      hearingEnhancementEquipment: 'INFRARED_SYSTEMS' as const,
    };
    const apiErrors = {
      hearingEnhancementEquipment: 'Invalid value',
    };

    postStub.withArgs(`/courts/${courtId}/v1/accessibility-options`, payload).rejects({
      isAxiosError: true,
      response: {
        data: apiErrors,
        status: HttpStatusCode.BadRequest,
      },
    });

    const response = await dataApiRequests.updateAccessibility(courtId, payload);

    expect(response).toEqual(new Map(Object.entries(apiErrors)));
  });

  it('returns internal server error when update accessibility throws a non-axios error', async () => {
    const courtId = '55555555-5555-4555-8555-555555555555';
    const payload = {
      courtId,
      hearingEnhancementEquipment: 'INFRARED_SYSTEMS' as const,
    };

    postStub.withArgs(`/courts/${courtId}/v1/accessibility-options`, payload).rejects(new Error('Unexpected error'));

    const response = await dataApiRequests.updateAccessibility(courtId, payload);

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });

  it('creates court contact detail and returns response status', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const payload = {
      courtContactDescriptionId: '11111111-1111-4111-8111-111111111111',
      courtId,
      email: 'contact@example.com',
      explanation: 'For enquiries',
      phoneNumber: '01234 567890',
    };

    postStub.withArgs(`/courts/${courtId}/v1/contact-details`, payload).resolves({ status: HttpStatusCode.Created });

    const response = await dataApiRequests.createCourtContactDetail(courtId, payload);

    expect(response).toBe(HttpStatusCode.Created);
  });

  it('returns validation errors map when create contact detail endpoint returns a 400', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const payload = {
      courtContactDescriptionId: '',
      courtId,
      email: 'invalid-email',
      explanation: 'For enquiries',
      phoneNumber: '01234 567890',
    };
    const apiErrors = {
      courtContactDescriptionId: 'Select a contact type',
      email: 'Enter an email address in the correct format',
    };

    postStub.withArgs(`/courts/${courtId}/v1/contact-details`, payload).rejects({
      isAxiosError: true,
      response: {
        data: apiErrors,
        status: HttpStatusCode.BadRequest,
      },
    });

    const response = await dataApiRequests.createCourtContactDetail(courtId, payload);

    expect(response).toEqual(new Map(Object.entries(apiErrors)));
  });

  it('returns conflict when create contact detail endpoint returns a non-400 axios error', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const payload = {
      courtContactDescriptionId: '11111111-1111-4111-8111-111111111111',
      courtId,
      email: 'contact@example.com',
      explanation: 'For enquiries',
      phoneNumber: '01234 567890',
    };

    postStub.withArgs(`/courts/${courtId}/v1/contact-details`, payload).rejects({
      isAxiosError: true,
      response: {
        data: 'conflict',
        status: HttpStatusCode.Conflict,
      },
    });

    const response = await dataApiRequests.createCourtContactDetail(courtId, payload);

    expect(response).toBe(HttpStatusCode.Conflict);
  });

  it('updates court contact detail and returns response status', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const contactDetailId = '99999999-9999-4999-8999-999999999999';
    const payload = {
      courtContactDescriptionId: '11111111-1111-4111-8111-111111111111',
      courtId,
      email: 'contact@example.com',
      explanation: 'For enquiries',
      phoneNumber: '01234 567890',
    };

    putStub.withArgs(`/courts/${courtId}/v1/contact-details/${contactDetailId}`, payload).resolves({
      status: HttpStatusCode.Ok,
    });

    const response = await dataApiRequests.updateCourtContactDetail(courtId, contactDetailId, payload);

    expect(response).toBe(HttpStatusCode.Ok);
  });

  it('returns validation errors map when update contact detail endpoint returns a 400', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const contactDetailId = '99999999-9999-4999-8999-999999999999';
    const payload = {
      courtContactDescriptionId: '11111111-1111-4111-8111-111111111111',
      courtId,
      email: 'invalid-email',
      explanation: 'For enquiries',
      phoneNumber: '01234 567890',
    };
    const apiErrors = {
      email: 'Enter an email address in the correct format',
      phoneNumber: 'Enter a phone number in the correct format',
    };

    putStub.withArgs(`/courts/${courtId}/v1/contact-details/${contactDetailId}`, payload).rejects({
      isAxiosError: true,
      response: {
        data: apiErrors,
        status: HttpStatusCode.BadRequest,
      },
    });

    const response = await dataApiRequests.updateCourtContactDetail(courtId, contactDetailId, payload);

    expect(response).toEqual(new Map(Object.entries(apiErrors)));
  });

  it('returns gone when update contact detail endpoint returns a non-400 axios error', async () => {
    const courtId = '77777777-7777-4777-8777-777777777777';
    const contactDetailId = '99999999-9999-4999-8999-999999999999';
    const payload = {
      courtContactDescriptionId: '11111111-1111-4111-8111-111111111111',
      courtId,
      email: 'contact@example.com',
      explanation: 'For enquiries',
      phoneNumber: '01234 567890',
    };

    putStub.withArgs(`/courts/${courtId}/v1/contact-details/${contactDetailId}`, payload).rejects({
      isAxiosError: true,
      response: {
        data: 'gone',
        status: HttpStatusCode.Gone,
      },
    });

    const response = await dataApiRequests.updateCourtContactDetail(courtId, contactDetailId, payload);

    expect(response).toBe(HttpStatusCode.Gone);
  });

  it('returns parsed audit subject options when response is valid', async () => {
    const responseBody = {
      COURT: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Reading Crown Court' }],
      SERVICE_CENTRE: [{ id: '22222222-2222-4222-8222-222222222222', name: 'Birmingham Service Centre' }],
    };

    getStub.withArgs('/audits/subjectoptions/v1').resolves({ data: responseBody });

    const response = await dataApiRequests.getAuditSubjectOptionsMap();

    expect(response).toEqual(
      new Map([
        ['COURT', [{ id: '11111111-1111-4111-8111-111111111111', name: 'Reading Crown Court' }]],
        ['SERVICE_CENTRE', [{ id: '22222222-2222-4222-8222-222222222222', name: 'Birmingham Service Centre' }]],
      ])
    );
  });

  it('returns internal server error and logs when audit subject options response fails schema validation', async () => {
    getStub.withArgs('/audits/subjectoptions/v1').resolves({
      data: {
        COURT: [{ id: 'not-a-uuid', name: 'Invalid Court' }],
      },
    });

    const response = await dataApiRequests.getAuditSubjectOptionsMap();

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error fetching audit subject names:', expect.anything());
  });

  it('returns axios status and logs when audit subject options endpoint errors', async () => {
    const badGatewayError = {
      isAxiosError: true,
      response: {
        data: 'bad gateway',
        status: HttpStatusCode.BadGateway,
      },
    };

    getStub.withArgs('/audits/subjectoptions/v1').rejects(badGatewayError);

    const response = await dataApiRequests.getAuditSubjectOptionsMap();

    expect(response).toBe(HttpStatusCode.BadGateway);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error fetching audit subject names:', badGatewayError);
  });

  it('returns internal server error and logs when audit subject options endpoint throws non-axios error', async () => {
    const nonAxiosError = new Error('Unexpected subject options error');
    getStub.withArgs('/audits/subjectoptions/v1').rejects(nonAxiosError);

    const response = await dataApiRequests.getAuditSubjectOptionsMap();

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error fetching audit subject names:', nonAxiosError);
  });

  it('returns parsed paged audits when response is valid', async () => {
    const params = {
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-20',
      toDate: '2026-06-26',
      email: 'admin@example.com',
      subjectType: 'COURT',
      courtId: '11111111-1111-4111-8111-111111111111',
      serviceCentreId: undefined,
    };
    const audits = {
      content: [
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          subjectId: '11111111-1111-4111-8111-111111111111',
          subjectType: 'COURT',
          userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          user: {
            email: 'admin@example.com',
            favouriteCourts: null,
            id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            lastLogin: '2026-06-26T09:10:11.123Z',
            role: 'SUPER_ADMIN',
            ssoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          },
          actionType: 'UPDATE',
          actionEntity: 'court',
          actionDataDiff: null,
          createdAt: '2026-06-26T09:10:11.123Z',
        },
      ],
      page: {
        number: 0,
        size: 25,
        totalElements: 1,
        totalPages: 1,
      },
    };

    getStub.withArgs('/audits/v1', { params }).resolves({ data: audits });

    const response = await dataApiRequests.getAudits(params);

    expect(response).toEqual(audits);
  });

  it('returns internal server error and logs when audits response fails schema validation', async () => {
    const params = {
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-20',
    };

    getStub.withArgs('/audits/v1', { params }).resolves({
      data: {
        content: [{ id: 'missing-required-fields' }],
        page: {
          number: 0,
          size: 25,
          totalElements: 1,
          totalPages: 1,
        },
      },
    });

    const response = await dataApiRequests.getAudits(params);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error fetching audits:', expect.anything());
  });

  it('returns axios status and logs when audits endpoint errors', async () => {
    const params = {
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-20',
    };
    const serviceUnavailableError = {
      isAxiosError: true,
      response: {
        data: 'service unavailable',
        status: HttpStatusCode.ServiceUnavailable,
      },
    };

    getStub.withArgs('/audits/v1', { params }).rejects(serviceUnavailableError);

    const response = await dataApiRequests.getAudits(params);

    expect(response).toBe(HttpStatusCode.ServiceUnavailable);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error fetching audits:', serviceUnavailableError);
  });

  it('returns internal server error and logs when audits endpoint throws non-axios error', async () => {
    const params = {
      pageNumber: 0,
      pageSize: 25,
      fromDate: '2026-06-20',
    };
    const nonAxiosError = new Error('Unexpected audits error');

    getStub.withArgs('/audits/v1', { params }).rejects(nonAxiosError);

    const response = await dataApiRequests.getAudits(params);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith('Error fetching audits:', nonAxiosError);
  });

  it('returns parsed audit by id when response is valid', async () => {
    const auditId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const audit = {
      id: auditId,
      subjectId: '11111111-1111-4111-8111-111111111111',
      subjectType: 'COURT',
      userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      user: {
        email: 'admin@example.com',
        favouriteCourts: null,
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        lastLogin: '2026-06-26T09:10:11.123Z',
        role: 'SUPER_ADMIN',
        ssoId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      },
      actionType: 'UPDATE',
      actionEntity: 'court',
      actionDataDiff: null,
      createdAt: '2026-06-26T09:10:11.123Z',
    };

    getStub.withArgs(`/audits/${auditId}/v1`).resolves({ data: audit });

    const response = await dataApiRequests.getAuditById(auditId);

    expect(response).toEqual(audit);
  });

  it('returns internal server error and logs when audit by id response fails schema validation', async () => {
    const auditId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    getStub.withArgs(`/audits/${auditId}/v1`).resolves({
      data: {
        id: auditId,
      },
    });

    const response = await dataApiRequests.getAuditById(auditId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      `Error fetching audit details for id ${auditId}:`,
      expect.anything()
    );
  });

  it('returns axios status and logs when audit by id endpoint errors', async () => {
    const auditId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const notFoundError = {
      isAxiosError: true,
      response: {
        data: 'not found',
        status: HttpStatusCode.NotFound,
      },
    };

    getStub.withArgs(`/audits/${auditId}/v1`).rejects(notFoundError);

    const response = await dataApiRequests.getAuditById(auditId);

    expect(response).toBe(HttpStatusCode.NotFound);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      `Error fetching audit details for id ${auditId}:`,
      notFoundError
    );
  });

  it('returns internal server error and logs when audit by id endpoint throws non-axios error', async () => {
    const auditId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const nonAxiosError = new Error('Unexpected audit by id error');

    getStub.withArgs(`/audits/${auditId}/v1`).rejects(nonAxiosError);

    const response = await dataApiRequests.getAuditById(auditId);

    expect(response).toBe(HttpStatusCode.InternalServerError);
    expect(mockDataApiLogger.error).toHaveBeenCalledWith(
      `Error fetching audit details for id ${auditId}:`,
      nonAxiosError
    );
  });
});
