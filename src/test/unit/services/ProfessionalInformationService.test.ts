import { HttpStatusCode } from 'axios';

import { ProfessionalInformationService } from '../../../main/services/ProfessionalInformationService';

const courtId = '11111111-1111-4111-8111-111111111111';
const court = {
  id: courtId,
  name: 'Reading Crown Court',
};

const professionalInformationResponse = {
  professionalInformation: {
    accessScheme: false,
    commonPlatform: true,
    interviewPhoneNumber: '020 7450 4000',
    interviewRoomCount: 3,
    interviewRooms: true,
    videoHearings: false,
  },
  codes: {
    countyCourtCode: null,
    crownCourtCode: 456,
    familyCourtCode: 123,
    gbs: 'GBS123',
    magistrateCourtCode: null,
    tribunalCode: null,
  },
  dxCodes: [{ dxCode: 'DX 12345', explanation: 'Documents' }],
  faxNumbers: [{ faxNumber: '01273 800 900', description: 'Main fax' }],
};

const buildDataApiRequests = (overrides: Partial<Record<string, jest.Mock>> = {}) =>
  ({
    getCourtById: jest.fn().mockResolvedValue(court),
    getCourtLocalAuthorities: jest.fn().mockResolvedValue([]),
    getCourtProfessionalInformation: jest.fn().mockResolvedValue(professionalInformationResponse),
    saveCourtProfessionalInformation: jest.fn().mockResolvedValue(professionalInformationResponse),
    ...overrides,
  }) as never;

describe('ProfessionalInformationService', () => {
  test('builds a populated view model from professional information', async () => {
    const dataApiRequests = buildDataApiRequests();

    const result = await new ProfessionalInformationService(dataApiRequests).getViewModel(courtId);

    expect(result).toMatchObject({
      accessScheme: false,
      commonPlatform: true,
      courtId,
      courtName: 'Reading Crown Court',
      dxCodes: [{ code: 'DX 12345', description: 'Documents' }],
      faxNumbers: [{ code: '01273 800 900', description: 'Main fax' }],
      gbs: 'GBS123',
      interviewPhoneNumber: '020 7450 4000',
      interviewRoomCount: '3',
      interviewRooms: true,
      pageTitle: 'Information for professionals - Reading Crown Court',
      selectedCourtTypes: ['family', 'crown'],
      selectedCourtTypeCodes: {
        countyCourtCode: '',
        crownCourtCode: '456',
        familyCourtCode: '123',
        magistrateCourtCode: '',
        tribunalCode: '',
      },
      videoHearings: false,
    });
  });

  test('builds an empty view model when professional information is not present', async () => {
    const dataApiRequests = buildDataApiRequests({
      getCourtProfessionalInformation: jest.fn().mockResolvedValue(null),
    });

    const result = await new ProfessionalInformationService(dataApiRequests).getViewModel(courtId);

    expect(result).toMatchObject({
      dxCodes: [{ code: '', description: '' }],
      faxNumbers: [{ code: '', description: '' }],
      gbs: '',
      interviewPhoneNumber: '',
      interviewRoomCount: '',
      selectedCourtTypes: [],
    });
  });

  test('returns upstream status codes while building the view model', async () => {
    await expect(
      new ProfessionalInformationService(
        buildDataApiRequests({
          getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
        })
      ).getViewModel(courtId)
    ).resolves.toBe(HttpStatusCode.NotFound);

    await expect(
      new ProfessionalInformationService(
        buildDataApiRequests({
          getCourtProfessionalInformation: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
        })
      ).getViewModel(courtId)
    ).resolves.toBe(HttpStatusCode.InternalServerError);
  });

  test('saves valid submitted professional information', async () => {
    const dataApiRequests = buildDataApiRequests({
      getCourtProfessionalInformation: jest.fn().mockResolvedValue(null),
    }) as never as {
      saveCourtProfessionalInformation: jest.Mock;
    };
    const service = new ProfessionalInformationService(dataApiRequests as never);

    const result = await service.save(courtId, {
      accessScheme: 'false',
      commonPlatform: 'true',
      courtTypes: ['family', 'crown'],
      crownCourtCode: '456',
      'dxCode-0': ' DX 12345 ',
      'dxCode-1': '',
      'dxCodeDescription-0': ' Documents ',
      'dxCodeDescriptionCy-0': ' Dogfennau ',
      'dxCodeDescription-1': '',
      familyCourtCode: '123',
      'faxNumber-0': ' 01273 800 900 ',
      'faxNumberDescription-0': ' Main fax ',
      'faxNumberDescriptionCy-0': ' Prif ffacs ',
      gbs: ' GBS123 ',
      interviewPhoneNumber: ' 020 7450 4000 ',
      interviewRoomCount: '2',
      interviewRooms: 'true',
      videoHearings: 'false',
    });

    expect(result).toMatchObject({
      status: 'saved',
      viewModel: {
        courtName: 'Reading Crown Court',
      },
    });
    expect(dataApiRequests.saveCourtProfessionalInformation).toHaveBeenCalledWith(courtId, {
      codes: {
        countyCourtCode: null,
        crownCourtCode: 456,
        familyCourtCode: 123,
        gbs: 'GBS123',
        magistrateCourtCode: null,
        tribunalCode: null,
      },
      dxCodes: [{ dxCode: 'DX 12345', explanation: 'Documents', explanationCy: 'Dogfennau' }],
      faxNumbers: [{ faxNumber: '01273 800 900', description: 'Main fax', descriptionCy: 'Prif ffacs' }],
      professionalInformation: {
        accessScheme: false,
        commonPlatform: true,
        interviewPhoneNumber: '020 7450 4000',
        interviewRoomCount: 2,
        interviewRooms: true,
        videoHearings: false,
      },
    });
  });

  test('saves optional empty fields as nulls, empty arrays and false booleans', async () => {
    const dataApiRequests = buildDataApiRequests() as never as {
      saveCourtProfessionalInformation: jest.Mock;
    };

    const result = await new ProfessionalInformationService(dataApiRequests as never).save(courtId, {});

    expect(result).toMatchObject({ status: 'saved' });
    expect(dataApiRequests.saveCourtProfessionalInformation).toHaveBeenCalledWith(courtId, {
      codes: null,
      dxCodes: [],
      faxNumbers: [],
      professionalInformation: {
        accessScheme: false,
        commonPlatform: false,
        interviewPhoneNumber: null,
        interviewRoomCount: 0,
        interviewRooms: false,
        videoHearings: false,
      },
    });
  });

  test('returns validation errors without saving invalid submitted values', async () => {
    const dataApiRequests = buildDataApiRequests() as never as {
      saveCourtProfessionalInformation: jest.Mock;
    };

    const result = await new ProfessionalInformationService(dataApiRequests as never).save(courtId, {
      courtTypes: ['family', 'crown'],
      crownCourtCode: 'ABC',
      'dxCodeDescription-0': 'Documents',
      familyCourtCode: '',
      'faxNumber-0': 'test',
      'faxNumberDescription-1': 'Secondary fax',
      interviewRoomCount: '0',
      interviewRooms: 'true',
    });

    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        fieldErrors: {
          crownCourtCode: 'Enter a crown court code using numbers only',
          'dxCode-0':
            'DX code 1: You have entered a DX code explanation without a DX code, please add a code or remove the explanation',
          familyCourtCode: 'Enter a family court code',
          'faxNumber-0':
            'Fax number 1: Enter a fax number in the correct format, for example 01273 800 900 or 020 7450 4000',
          'faxNumber-1':
            'Fax number 2: You have entered a description without a fax number, please add a number or remove the description',
          interviewRoomCount: 'Enter a number of interview rooms between 1 and 150, or select No',
        },
      },
    });
    expect(dataApiRequests.saveCourtProfessionalInformation).not.toHaveBeenCalled();
  });

  test('returns all repeatable frontend validation errors before saving', async () => {
    const dataApiRequests = buildDataApiRequests() as never as {
      saveCourtProfessionalInformation: jest.Mock;
    };

    const result = await new ProfessionalInformationService(dataApiRequests as never).save(courtId, {
      'dxCode-0': '@£@$&()@$)(@()$',
      'dxCodeDescription-0': '@£@$&()@$)(@()$',
      'dxCodeDescriptionCy-0': '@£@$&()@$)(@()$',
      'faxNumber-0': '@£@$&()@$)(@()$',
      'faxNumberDescription-0': '@£@$&()@$)(@()$',
      'faxNumberDescriptionCy-0': '@£@$&()@$)(@()$',
    });

    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        errorSummary: [
          { href: '#dxCode-0', text: 'DX code 1: Value contains invalid characters' },
          { href: '#dxCodeDescription-0', text: 'DX code 1 explanation: Value contains invalid characters' },
          { href: '#dxCodeDescriptionCy-0', text: 'DX code 1 welsh explanation: Value contains invalid characters' },
          {
            href: '#faxNumber-0',
            text: 'Fax number 1: Enter a fax number in the correct format, for example 01273 800 900 or 020 7450 4000',
          },
          { href: '#faxNumberDescription-0', text: 'Fax number 1 description: Value contains invalid characters' },
          {
            href: '#faxNumberDescriptionCy-0',
            text: 'Fax number 1 welsh description: Value contains invalid characters',
          },
        ],
      },
    });
    expect(dataApiRequests.saveCourtProfessionalInformation).not.toHaveBeenCalled();
  });

  test('returns directional errors when either English or Welsh descriptions are missing', async () => {
    const dataApiRequests = buildDataApiRequests() as never as {
      saveCourtProfessionalInformation: jest.Mock;
    };

    const result = await new ProfessionalInformationService(dataApiRequests as never).save(courtId, {
      'dxCode-0': 'DX 12345',
      'dxCodeDescription-0': 'Documents',
      'dxCode-1': 'DX 54321',
      'dxCodeDescriptionCy-1': 'Dogfennau',
      'faxNumber-0': '01273 800 900',
      'faxNumberDescriptionCy-0': 'Prif ffacs',
      'faxNumber-1': '020 7450 4000',
      'faxNumberDescription-1': 'Main fax',
    });

    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        fieldErrors: {
          'dxCodeDescriptionCy-0': 'DX code 1: Enter a Welsh explanation',
          'dxCodeDescription-1': 'DX code 2: Enter an explanation',
          'faxNumberDescription-0': 'Fax number 1: Enter a description',
          'faxNumberDescriptionCy-1': 'Fax number 2: Enter a Welsh description',
        },
      },
    });
    expect(dataApiRequests.saveCourtProfessionalInformation).not.toHaveBeenCalled();
  });

  test('validates missing and non-numeric interview room counts', async () => {
    const missingCount = await new ProfessionalInformationService(buildDataApiRequests()).save(courtId, {
      interviewRooms: 'true',
    });
    const nonNumericCount = await new ProfessionalInformationService(buildDataApiRequests()).save(courtId, {
      interviewRoomCount: 'abc',
      interviewRooms: 'true',
    });

    expect(missingCount).toMatchObject({
      status: 'validationError',
      viewModel: { fieldErrors: { interviewRoomCount: 'Enter the number of interview rooms' } },
    });
    expect(nonNumericCount).toMatchObject({
      status: 'validationError',
      viewModel: { fieldErrors: { interviewRoomCount: 'Enter the number of interview rooms using numbers only' } },
    });
  });

  test('maps API validation errors back to form fields', async () => {
    const dataApiRequests = buildDataApiRequests({
      saveCourtProfessionalInformation: jest.fn().mockResolvedValue(
        new Map([
          [
            'message',
            'Interview room count must be between 1 and 150 when interview rooms are available; otherwise omit or set to 0',
          ],
          ['faxNumber', "Phone Number must match the regex '^(|(\\+44|)[0-9 ]{10,20})$'"],
          ['timestamp', '2026-06-12T10:24:23.354464'],
        ])
      ),
    });

    const result = await new ProfessionalInformationService(dataApiRequests).save(courtId, {
      interviewRoomCount: '150',
      interviewRooms: 'true',
    });

    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        errorSummary: [
          { href: '#interviewRoomCount', text: 'Enter a number of interview rooms between 1 and 150, or select No' },
          {
            href: '#faxNumber-0',
            text: 'Enter a fax number in the correct format, for example 01273 800 900 or 020 7450 4000',
          },
        ],
      },
    });
  });

  test('maps API validation errors for every professional information field to form anchors', async () => {
    const dataApiRequests = buildDataApiRequests({
      saveCourtProfessionalInformation: jest.fn().mockResolvedValue(
        new Map([
          ['codes.countyCourtCode', 'County court code must be 10 characters or fewer'],
          ['codes.gbs', 'GBS code must be 10 characters or fewer'],
          ['dxCodes[0].dxCode', 'DX code must be 200 characters or fewer'],
          ['dxCodes[0].explanation', 'Explanation must be 200 characters or fewer'],
          ['faxNumbers[0].faxNumber', 'Fax number must be 200 characters or fewer'],
          ['faxNumbers[0].description', 'Description must be 200 characters or fewer'],
          ['professionalInformation.interviewPhoneNumber', 'Interview phone number must be 20 characters or fewer'],
          ['professionalInformation.videoHearings', 'Video hearing facilities must be true or false'],
          ['professionalInformation.commonPlatform', 'Common platform must be true or false'],
          ['professionalInformation.accessScheme', 'Access scheme must be true or false'],
        ])
      ),
    });

    const result = await new ProfessionalInformationService(dataApiRequests).save(courtId, {});

    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        errorSummary: [
          { href: '#countyCourtCode', text: 'County court code must be 10 characters or fewer' },
          { href: '#gbs', text: 'GBS code must be 10 characters or fewer' },
          { href: '#dxCode-0', text: 'DX code 1: DX code must be 200 characters or fewer' },
          { href: '#dxCodeDescription-0', text: 'DX code 1 explanation: Explanation must be 200 characters or fewer' },
          { href: '#faxNumber-0', text: 'Fax number 1: Fax number must be 200 characters or fewer' },
          {
            href: '#faxNumberDescription-0',
            text: 'Fax number 1 description: Description must be 200 characters or fewer',
          },
          { href: '#interviewPhoneNumber', text: 'Interview phone number must be 20 characters or fewer' },
          { href: '#videoHearings', text: 'Video hearing facilities must be true or false' },
          { href: '#commonPlatform', text: 'Common platform must be true or false' },
          { href: '#accessScheme', text: 'Access scheme must be true or false' },
        ],
        fieldErrors: {
          accessScheme: 'Access scheme must be true or false',
          commonPlatform: 'Common platform must be true or false',
          countyCourtCode: 'County court code must be 10 characters or fewer',
          'dxCode-0': 'DX code 1: DX code must be 200 characters or fewer',
          'dxCodeDescription-0': 'DX code 1 explanation: Explanation must be 200 characters or fewer',
          'faxNumber-0': 'Fax number 1: Fax number must be 200 characters or fewer',
          'faxNumberDescription-0': 'Fax number 1 description: Description must be 200 characters or fewer',
          gbs: 'GBS code must be 10 characters or fewer',
          interviewPhoneNumber: 'Interview phone number must be 20 characters or fewer',
          videoHearings: 'Video hearing facilities must be true or false',
        },
      },
    });
  });

  test('maps indexed API validation errors to the matching repeatable field anchors', async () => {
    const dataApiRequests = buildDataApiRequests({
      saveCourtProfessionalInformation: jest.fn().mockResolvedValue(
        new Map([
          ['dxCodes[1].dxCode', 'Value contains invalid characters'],
          ['dxCodes[1].explanation', 'Explanation contains invalid characters'],
          ['faxNumbers[1].faxNumber', 'Fax number contains invalid characters'],
          ['faxNumbers[1].description', 'Description contains invalid characters'],
        ])
      ),
    });

    const result = await new ProfessionalInformationService(dataApiRequests).save(courtId, {
      'dxCode-0': 'DX 123',
      'dxCode-1': 'Invalid DX',
      'dxCodeDescription-1': 'Invalid DX explanation',
      'dxCodeDescriptionCy-1': 'Esboniad DX annilys',
      'faxNumber-0': '020 0000 0000',
      'faxNumber-1': '020 0000 0001',
      'faxNumberDescription-1': 'Invalid fax description',
      'faxNumberDescriptionCy-1': 'Disgrifiad ffacs annilys',
    });

    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        errorSummary: [
          { href: '#dxCode-1', text: 'DX code 2: Value contains invalid characters' },
          { href: '#dxCodeDescription-1', text: 'DX code 2 explanation: Explanation contains invalid characters' },
          { href: '#faxNumber-1', text: 'Fax number 2: Fax number contains invalid characters' },
          {
            href: '#faxNumberDescription-1',
            text: 'Fax number 2 description: Description contains invalid characters',
          },
        ],
        fieldErrors: {
          'dxCode-1': 'DX code 2: Value contains invalid characters',
          'dxCodeDescription-1': 'DX code 2 explanation: Explanation contains invalid characters',
          'faxNumber-1': 'Fax number 2: Fax number contains invalid characters',
          'faxNumberDescription-1': 'Fax number 2 description: Description contains invalid characters',
        },
      },
    });
  });

  test('keeps repeated API validation errors linked and labelled by repeatable field index', async () => {
    const dataApiRequests = buildDataApiRequests({
      saveCourtProfessionalInformation: jest.fn().mockResolvedValue(
        new Map([
          ['dxCodes[0].dxCode', 'Value contains invalid characters'],
          ['dxCodes[3].dxCode', 'Value contains invalid characters'],
          ['faxNumbers[0].faxNumber', 'Value contains invalid characters'],
          ['faxNumbers[4].faxNumber', 'Value contains invalid characters'],
        ])
      ),
    });

    const result = await new ProfessionalInformationService(dataApiRequests).save(courtId, {
      'dxCode-0': 'Invalid DX 1',
      'dxCode-1': 'DX 2',
      'dxCode-2': 'DX 3',
      'dxCode-3': 'Invalid DX 4',
      'dxCode-4': 'DX 5',
      'faxNumber-0': '020 0000 0000',
      'faxNumber-1': '020 0000 0001',
      'faxNumber-2': '020 0000 0002',
      'faxNumber-3': '020 0000 0003',
      'faxNumber-4': '020 0000 0004',
    });

    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        errorSummary: [
          { href: '#dxCode-0', text: 'DX code 1: Value contains invalid characters' },
          { href: '#dxCode-3', text: 'DX code 4: Value contains invalid characters' },
          { href: '#faxNumber-0', text: 'Fax number 1: Value contains invalid characters' },
          { href: '#faxNumber-4', text: 'Fax number 5: Value contains invalid characters' },
        ],
      },
    });
  });

  test('maps repeatable API validation errors back to the original visible field indexes after blank rows are omitted from the payload', async () => {
    const dataApiRequests = buildDataApiRequests({
      saveCourtProfessionalInformation: jest.fn().mockResolvedValue(
        new Map([
          ['dxCodes[0].dxCode', 'Value contains invalid characters'],
          ['faxNumbers[0].faxNumber', 'Value contains invalid characters'],
        ])
      ),
    }) as never as {
      saveCourtProfessionalInformation: jest.Mock;
    };

    const result = await new ProfessionalInformationService(dataApiRequests as never).save(courtId, {
      'dxCode-3': 'Invalid DX 4',
      'faxNumber-4': '020 0000 0004',
    });

    expect(dataApiRequests.saveCourtProfessionalInformation).toHaveBeenCalledWith(
      courtId,
      expect.objectContaining({
        dxCodes: [{ dxCode: 'Invalid DX 4', explanation: null, explanationCy: null }],
        faxNumbers: [{ faxNumber: '020 0000 0004', description: null, descriptionCy: null }],
      })
    );
    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        errorSummary: [
          { href: '#dxCode-3', text: 'DX code 4: Value contains invalid characters' },
          { href: '#faxNumber-4', text: 'Fax number 5: Value contains invalid characters' },
        ],
      },
    });
  });

  test('links repeatable frontend validation errors to the original visible field indexes after blank rows', async () => {
    const dataApiRequests = buildDataApiRequests() as never as {
      saveCourtProfessionalInformation: jest.Mock;
    };

    const result = await new ProfessionalInformationService(dataApiRequests as never).save(courtId, {
      'dxCodeDescription-3': 'Documents',
      'faxNumberDescription-4': 'Secondary fax',
    });

    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        errorSummary: [
          {
            href: '#dxCode-3',
            text: 'DX code 4: You have entered a DX code explanation without a DX code, please add a code or remove the explanation',
          },
          {
            href: '#dxCodeDescriptionCy-3',
            text: 'DX code 4: Enter a Welsh explanation',
          },
          {
            href: '#faxNumber-4',
            text: 'Fax number 5: You have entered a description without a fax number, please add a number or remove the description',
          },
          {
            href: '#faxNumberDescriptionCy-4',
            text: 'Fax number 5: Enter a Welsh description',
          },
        ],
      },
    });
    expect(dataApiRequests.saveCourtProfessionalInformation).not.toHaveBeenCalled();
  });

  test('returns status codes from save dependencies', async () => {
    await expect(
      new ProfessionalInformationService(
        buildDataApiRequests({
          getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
        })
      ).save(courtId, {})
    ).resolves.toBe(HttpStatusCode.NotFound);

    await expect(
      new ProfessionalInformationService(
        buildDataApiRequests({
          saveCourtProfessionalInformation: jest.fn().mockResolvedValue(HttpStatusCode.Forbidden),
        })
      ).save(courtId, {})
    ).resolves.toBe(HttpStatusCode.Forbidden);
  });

  test('requires family court removal confirmation when selected local authority config exists', async () => {
    const dataApiRequests = buildDataApiRequests({
      getCourtLocalAuthorities: jest.fn().mockResolvedValue([
        {
          areaOfLawName: 'Children',
          localAuthorities: [{ id: '22222222-2222-4222-8222-222222222222', selected: true }],
        },
      ]),
    }) as never as {
      getCourtLocalAuthorities: jest.Mock;
    };

    const result = await new ProfessionalInformationService(
      dataApiRequests as never
    ).requiresFamilyCourtRemovalConfirmation(courtId, {
      courtTypes: ['crown'],
      crownCourtCode: '456',
    });

    expect(result).toEqual({
      courtName: 'Reading Crown Court',
      required: true,
    });
    expect(dataApiRequests.getCourtLocalAuthorities).toHaveBeenCalledWith(courtId);
  });

  test('does not require family court removal confirmation when family remains selected or nothing is selected', async () => {
    await expect(
      new ProfessionalInformationService(buildDataApiRequests()).requiresFamilyCourtRemovalConfirmation(courtId, {
        courtTypes: ['family'],
      })
    ).resolves.toEqual({
      courtName: 'Reading Crown Court',
      required: false,
    });

    await expect(
      new ProfessionalInformationService(
        buildDataApiRequests({
          getCourtProfessionalInformation: jest.fn().mockResolvedValue(null),
        })
      ).requiresFamilyCourtRemovalConfirmation(courtId, {})
    ).resolves.toEqual({
      courtName: 'Reading Crown Court',
      required: false,
    });
  });

  test('returns status codes from family court removal confirmation dependencies', async () => {
    await expect(
      new ProfessionalInformationService(
        buildDataApiRequests({
          getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
        })
      ).requiresFamilyCourtRemovalConfirmation(courtId, {})
    ).resolves.toBe(HttpStatusCode.NotFound);

    await expect(
      new ProfessionalInformationService(
        buildDataApiRequests({
          getCourtLocalAuthorities: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
        })
      ).requiresFamilyCourtRemovalConfirmation(courtId, { courtTypes: [] })
    ).resolves.toBe(HttpStatusCode.InternalServerError);
  });
});
