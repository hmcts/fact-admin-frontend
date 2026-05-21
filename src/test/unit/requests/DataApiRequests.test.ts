import { HttpStatusCode } from 'axios';
import sinon, { restore, stub } from 'sinon';

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
  let putStub: sinon.SinonStub;

  beforeEach(() => {
    restore();
    getStub = stub(dataApi, 'get');
    putStub = stub(dataApi, 'put');
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
          id: '44444444-4444-4444-8444-444444444444',
          isServiceCentre: false,
          lastUpdatedAt: '2026-04-29T10:00:00Z',
          name: 'London Civil and Family Court',
          open: true,
          regionId: '33333333-3333-4333-8333-333333333333',
          slug: 'london-civil-and-family-court',
        },
      ],
      page: {
        number: 0,
        size: 25,
        totalElements: 1,
        totalPages: 1,
      },
    };

    getStub.withArgs('/courts/v1', { params }).resolves({ data: courts });

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

    getStub.withArgs('/courts/v1', { params: {} }).rejects(forbiddenError);

    const response = await dataApiRequests.getCourts();

    expect(response).toBe(HttpStatusCode.Forbidden);
  });

  it('returns internal server error when the courts response fails schema validation', async () => {
    getStub.withArgs('/courts/v1', { params: {} }).resolves({
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
      isServiceCentre: false,
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

  it('returns parsed court details when the bulk court response is valid', async () => {
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
            addressLine1: '1 High Street',
            addressLine2: null,
            townCity: 'London',
            county: null,
            postcode: 'SW1A 1AA',
            epimId: null,
            lat: 51.501,
            lon: -0.141,
            addressType: 'VISIT_US',
            areasOfLaw: [],
            courtTypes: [],
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
            waitingAreaChildren: false,
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
                name: 'Divorce',
                nameCy: 'Ysgariad',
                externalLink: null,
                externalLinkCy: null,
                displayName: null,
                displayNameCy: null,
              },
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

    getStub.withArgs('/courts/all/v1').resolves({ data: allCourts });

    const response = await dataApiRequests.getAllCourts();

    expect(response).toEqual(allCourts);
  });

  it('returns bad request when the bulk court endpoint returns a 400', async () => {
    const badRequestError = {
      isAxiosError: true,
      response: {
        data: 'bad request',
        status: 400,
      },
    };

    getStub.withArgs('/courts/all/v1').rejects(badRequestError);

    const response = await dataApiRequests.getAllCourts();

    expect(response).toBe(HttpStatusCode.BadRequest);
  });

  it('returns internal server error when the bulk court response fails schema validation', async () => {
    getStub.withArgs('/courts/all/v1').resolves({
      data: [
        {
          name: 'Incomplete court',
        },
      ],
    });

    const response = await dataApiRequests.getAllCourts();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });
});
