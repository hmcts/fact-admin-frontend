import { HttpStatusCode } from 'axios';

import { DownloadCsvService } from '../../../main/services/DownloadCsvService';

describe('DownloadCsvService', () => {
  test('returns a CSV export and filename for all locations', async () => {
    const service = new DownloadCsvService({
      getAllLocations: jest.fn().mockResolvedValue([
        {
          locationType: 'COURT',
          serviceCentre: false,
          serviceCentreDetails: null,
          court: {
            courtAddresses: [
              {
                addressLine1: '1 High Street',
                addressLine2: null,
                addressType: 'VISIT_US',
                areasOfLaw: [],
                county: null,
                courtTypes: [],
                epimId: null,
                lat: 51.501,
                lon: -0.141,
                postcode: 'SW1A 1AA',
                townCity: 'London',
              },
              {
                addressLine1: 'PO Box 1',
                addressLine2: null,
                addressType: 'WRITE_TO_US',
                areasOfLaw: [],
                county: 'Berkshire',
                courtTypes: [],
                epimId: null,
                lat: null,
                lon: null,
                postcode: 'RG1 1AA',
                townCity: 'Reading',
              },
            ],
            courtAccessibilityOptions: [],
            courtAreasOfLaw: [
              {
                areasOfLaw: [
                  {
                    displayName: null,
                    displayNameCy: null,
                    externalLink: null,
                    externalLinkCy: null,
                    name: 'Divorce',
                    nameCy: 'Ysgariad',
                  },
                  {
                    displayName: null,
                    displayNameCy: null,
                    externalLink: null,
                    externalLinkCy: null,
                    name: 'Probate',
                    nameCy: 'Profiant',
                  },
                  '77777777-7777-4777-8777-777777777777',
                ],
              },
            ],
            courtCodes: [
              {
                countyCourtCode: 456,
                crownCourtCode: 789,
                familyCourtCode: 123,
                gbs: null,
                magistrateCourtCode: 321,
                tribunalCode: 654,
              },
            ],
            courtContactDetails: [
              {
                courtContactDescription: {
                  name: 'Enquiries',
                  nameCy: 'Ymholiadau',
                },
                courtContactDescriptionId: '66666666-6666-4666-8666-666666666666',
                email: 'court@example.com',
                explanation: 'Appointments',
                explanationCy: null,
                phoneNumber: '01234 567890',
              },
            ],
            courtCounterServiceOpeningHours: [
              {
                appointmentContact: null,
                appointmentNeeded: false,
                assistWithDocuments: false,
                assistWithForms: false,
                assistWithSupport: false,
                counterService: true,
                courtTypes: [],
                openingTimesDetails: [
                  {
                    closingTime: '17:00',
                    dayOfWeek: 'MONDAY',
                    openingTime: '09:00',
                  },
                ],
              },
            ],
            courtDxCodes: [
              {
                dxCode: 'DX 123',
                explanation: 'Document exchange',
              },
            ],
            courtFacilities: [
              {
                babyChanging: false,
                cafeteria: false,
                drinkVendingMachines: false,
                freeWaterDispensers: true,
                parking: true,
                quietRoom: false,
                snackVendingMachines: false,
                waitingArea: true,
                waitingAreaChildren: false,
                wifi: true,
              },
            ],
            courtFaxNumbers: [],
            courtOpeningHours: [
              {
                openingHourType: {
                  name: 'Building',
                  nameCy: 'Adeilad',
                },
                openingTimesDetails: [
                  {
                    closingTime: '17:00',
                    dayOfWeek: 'MONDAY',
                    openingTime: '09:00',
                  },
                ],
              },
            ],
            courtPhotos: [],
            courtProfessionalInformation: [],
            courtTranslations: [
              {
                email: 'translations@example.com',
                phoneNumber: '01234 567891',
              },
            ],
            id: '11111111-1111-4111-8111-111111111111',
            lastUpdatedAt: '2026-04-29T10:00:00Z',
            mrdId: 'MRD-123',
            name: 'Reading Crown Court',
            open: true,
            openOnCath: true,
            region: {
              country: 'England',
              name: 'London',
            },
            slug: 'reading-crown-court',
            warningNotice: null,
          },
        },
        {
          locationType: 'SERVICE_CENTRE',
          serviceCentre: true,
          court: null,
          serviceCentreDetails: {
            id: '22222222-2222-4222-8222-222222222222',
            name: 'National Business Centre',
            slug: 'national-business-centre',
            open: true,
            warningNotice: null,
            createdAt: '2026-04-29T09:00:00Z',
            lastUpdatedAt: '2026-04-30T10:00:00Z',
            serviceAreas: [
              {
                id: '33333333-3333-4333-8333-333333333333',
                name: 'Family',
                nameCy: 'Teulu',
              },
              '99999999-9999-4999-8999-999999999999',
            ],
            catchmentType: 'NATIONAL',
            serviceCentreAddresses: [
              {
                addressLine1: '2 Centre Street',
                addressLine2: null,
                addressType: 'VISIT_US',
                county: null,
                lat: 51.502,
                lon: -0.142,
                postcode: 'SW1A 2AA',
                townCity: 'London',
              },
            ],
            serviceCentreContactDetails: [
              {
                email: 'service@example.com',
                explanation: 'Applications',
                explanationCy: null,
                phoneNumber: '01234 111111',
                serviceCentreContactDescription: {
                  id: '44444444-4444-4444-8444-444444444444',
                  name: 'Enquiries',
                  nameCy: 'Ymholiadau',
                },
              },
            ],
            serviceCentreAreasOfLaw: [
              {
                areasOfLaw: [
                  {
                    displayName: null,
                    displayNameCy: null,
                    externalLink: null,
                    externalLinkCy: null,
                    id: '55555555-5555-4555-8555-555555555555',
                    name: 'Family public law',
                    nameCy: 'Cyfraith gyhoeddus teulu',
                  },
                  '88888888-8888-4888-8888-888888888888',
                ],
              },
            ],
          },
        },
      ]),
    } as never);

    const response = await service.getDownloadCsv(new Date('2026-05-05T10:00:00Z'));

    expect(typeof response).toBe('object');

    if (typeof response === 'number') {
      throw new Error('Expected CSV response');
    }

    expect(response.filename).toBe('courts-2026-05-05.csv');
    expect(response.csv).toContain(
      'Name,Open/Closed,Updated date,Addresses,Areas of law,Type,Crown court code,County court code,Magistrates court code,Facilities,Url,Emails,Contacts,DX,Opening times'
    );
    expect(response.csv).toContain('Reading Crown Court,Open,2026-04-29');
    expect(response.csv).toContain(
      '"Visit us: 1 High Street, London, SW1A 1AA\nWrite to us: PO Box 1, Reading, Berkshire, RG1 1AA"'
    );
    expect(response.csv).toContain('"Divorce\nProbate"');
    expect(response.csv).not.toContain('77777777-7777-4777-8777-777777777777');
    expect(response.csv).toContain('"Magistrates\' Court\nFamily Court\nTribunal\nCounty Court\nCrown Court"');
    expect(response.csv).toContain('789,456,321');
    expect(response.csv).toContain('"Parking\nFree water dispensers\nWaiting area\nWiFi"');
    expect(response.csv).toContain('https://localhost:3344/courts/reading-crown-court');
    expect(response.csv).toContain('"court@example.com\ntranslations@example.com"');
    expect(response.csv).toContain('"Enquiries - Appointments: 01234 567890\nTranslations: 01234 567891"');
    expect(response.csv).toContain('DX 123 (Document exchange)');
    expect(response.csv).toContain('"Building: Monday 09:00 to 17:00\nCounter service: Monday 09:00 to 17:00"');
    expect(response.csv).toContain('National Business Centre,Open,2026-04-30');
    expect(response.csv).toContain('Visit us: 2 Centre Street, London, SW1A 2AA');
    expect(response.csv).toContain('Family public law');
    expect(response.csv).not.toContain('88888888-8888-4888-8888-888888888888');
    expect(response.csv).not.toContain('99999999-9999-4999-8999-999999999999');
    expect(response.csv).toContain('https://localhost:3344/service-centres/national-business-centre');
    expect(response.csv).toContain('service@example.com,Enquiries - Applications: 01234 111111');
  });

  test('returns the upstream status code when loading locations fails', async () => {
    const service = new DownloadCsvService({
      getAllLocations: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    } as never);

    const response = await service.getDownloadCsv();

    expect(response).toBe(HttpStatusCode.InternalServerError);
  });
});
