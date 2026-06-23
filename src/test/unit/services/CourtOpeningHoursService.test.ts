import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import {
  CourtOpeningHoursService,
  OpeningHoursForm,
  SaveOpeningHoursResult,
} from '../../../main/services/CourtOpeningHoursService';

type ValidationErrorResult = Extract<SaveOpeningHoursResult, { type: 'validation_error' }>;

describe('CourtOpeningHoursService', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const openingHoursId = '22222222-2222-4222-8222-222222222222';
  const courtOpenType = {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Court open',
    nameCy: 'Oriau agor y Llys',
  };
  const tribunalOpenType = {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Tribunal open',
    nameCy: 'Oriau agor y tribiwnlys',
  };

  function buildService(overrides: Partial<DataApiRequests> = {}) {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      getOpeningHourTypes: jest.fn().mockResolvedValue([courtOpenType, tribunalOpenType]),
      getCourtOpeningHours: jest.fn().mockResolvedValue([]),
      getCourtOpeningHoursById: jest.fn(),
      saveCourtOpeningHours: jest.fn(),
      ...overrides,
    } as unknown as DataApiRequests;

    return {
      dataApiRequests,
      saveCourtOpeningHours: dataApiRequests.saveCourtOpeningHours as jest.Mock,
      service: new CourtOpeningHoursService(dataApiRequests),
    };
  }

  test('saves Monday to Friday opening hours as EVERYDAY when the same-time option is selected', async () => {
    const { saveCourtOpeningHours, service } = buildService({
      saveCourtOpeningHours: jest.fn().mockResolvedValue({
        id: openingHoursId,
        courtId,
        openingHourTypeId: courtOpenType.id,
        openingHourType: courtOpenType,
        openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
      }),
    });

    const result = await service.save(courtId, undefined, {
      openingHourTypeId: courtOpenType.id,
      sameTime: 'yes',
      selectedDays: [],
      sameOpeningHour: '9',
      sameOpeningMinute: '0',
      sameClosingHour: '17',
      sameClosingMinute: '0',
    });

    expect(result.type).toBe('success');
    expect(saveCourtOpeningHours).toHaveBeenCalledWith(courtId, {
      courtId,
      id: undefined,
      openingHourTypeId: courtOpenType.id,
      openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
    });
  });

  test('saves selected weekdays when different opening times are selected', async () => {
    const { saveCourtOpeningHours, service } = buildService({
      saveCourtOpeningHours: jest.fn().mockResolvedValue({
        id: openingHoursId,
        courtId,
        openingHourTypeId: tribunalOpenType.id,
        openingTimesDetails: [{ dayOfWeek: 'MONDAY', openingTime: '10:15', closingTime: '16:45' }],
      }),
    });

    const result = await service.save(courtId, undefined, {
      openingHourTypeId: tribunalOpenType.id,
      sameTime: 'no',
      selectedDays: ['MONDAY', 'SATURDAY'],
      mondayOpeningHour: '10',
      mondayOpeningMinute: '15',
      mondayClosingHour: '16',
      mondayClosingMinute: '45',
    });

    expect(result.type).toBe('success');
    expect(saveCourtOpeningHours).toHaveBeenCalledWith(courtId, {
      courtId,
      id: undefined,
      openingHourTypeId: tribunalOpenType.id,
      openingTimesDetails: [{ dayOfWeek: 'MONDAY', openingTime: '10:15', closingTime: '16:45' }],
    });
  });

  test('preserves existing unsupported days when editing representable weekday opening hours', async () => {
    const { saveCourtOpeningHours, service } = buildService({
      getCourtOpeningHours: jest.fn().mockResolvedValue([
        {
          id: openingHoursId,
          courtId,
          openingHourTypeId: tribunalOpenType.id,
          openingTimesDetails: [
            { dayOfWeek: 'MONDAY', openingTime: '09:00', closingTime: '17:00' },
            { dayOfWeek: 'SATURDAY', openingTime: '10:00', closingTime: '12:00' },
          ],
        },
      ]),
      getCourtOpeningHoursById: jest.fn().mockResolvedValue({
        id: openingHoursId,
        courtId,
        openingHourTypeId: tribunalOpenType.id,
        openingTimesDetails: [
          { dayOfWeek: 'MONDAY', openingTime: '09:00', closingTime: '17:00' },
          { dayOfWeek: 'SATURDAY', openingTime: '10:00', closingTime: '12:00' },
        ],
      }),
      saveCourtOpeningHours: jest.fn().mockResolvedValue({
        id: openingHoursId,
        courtId,
        openingHourTypeId: tribunalOpenType.id,
        openingTimesDetails: [
          { dayOfWeek: 'MONDAY', openingTime: '09:30', closingTime: '16:30' },
          { dayOfWeek: 'SATURDAY', openingTime: '10:00', closingTime: '12:00' },
        ],
      }),
    });

    const result = await service.save(courtId, openingHoursId, {
      openingHourTypeId: tribunalOpenType.id,
      sameTime: 'no',
      selectedDays: ['MONDAY'],
      mondayOpeningHour: '9',
      mondayOpeningMinute: '30',
      mondayClosingHour: '16',
      mondayClosingMinute: '30',
    });

    expect(result.type).toBe('success');
    expect(saveCourtOpeningHours).toHaveBeenCalledWith(courtId, {
      courtId,
      id: openingHoursId,
      openingHourTypeId: tribunalOpenType.id,
      openingTimesDetails: [
        { dayOfWeek: 'MONDAY', openingTime: '09:30', closingTime: '16:30' },
        { dayOfWeek: 'SATURDAY', openingTime: '10:00', closingTime: '12:00' },
      ],
    });
  });

  test('treats a no-content response from an edit save as success', async () => {
    const { saveCourtOpeningHours, service } = buildService({
      getCourtOpeningHours: jest.fn().mockResolvedValue([
        {
          id: openingHoursId,
          courtId,
          openingHourTypeId: courtOpenType.id,
          openingHourType: courtOpenType,
          openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
        },
      ]),
      getCourtOpeningHoursById: jest.fn().mockResolvedValue({
        id: openingHoursId,
        courtId,
        openingHourTypeId: courtOpenType.id,
        openingHourType: courtOpenType,
        openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
      }),
      saveCourtOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.NoContent),
    });

    const result = await service.save(courtId, openingHoursId, {
      openingHourTypeId: courtOpenType.id,
      sameTime: 'yes',
      selectedDays: [],
      sameOpeningHour: '9',
      sameOpeningMinute: '00',
      sameClosingHour: '16',
      sameClosingMinute: '30',
    });

    expect(result).toEqual({
      type: 'success',
      viewModel: {
        courtId,
        courtName: 'Reading Crown Court',
        openingHourType: courtOpenType.name,
      },
    });
    expect(saveCourtOpeningHours).toHaveBeenCalledWith(courtId, {
      courtId,
      id: openingHoursId,
      openingHourTypeId: courtOpenType.id,
      openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '16:30' }],
    });
  });

  test('normalises selected day values from request body input', () => {
    const { service } = buildService();

    expect(service.getSelectedDays('MONDAY')).toEqual(['MONDAY']);
    expect(service.getSelectedDays(['MONDAY', 1, 'TUESDAY'])).toEqual(['MONDAY', 'TUESDAY']);
    expect(service.getSelectedDays(undefined)).toEqual([]);
  });

  test('rejects duplicate opening hour types before saving', async () => {
    const { saveCourtOpeningHours, service } = buildService({
      getCourtOpeningHours: jest.fn().mockResolvedValue([
        {
          id: openingHoursId,
          courtId,
          openingHourTypeId: courtOpenType.id,
          openingHourType: courtOpenType,
          openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
        },
      ]),
    });

    const result = await service.save(courtId, undefined, validSameTimeForm());
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCourtOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toContainEqual({
      href: '#openingHourTypeId',
      text: 'A court can only have one opening hour per opening hour type. Please edit the other opening hour first.',
    });
  });

  test('rejects opening times after closing times and links errors to the time fields', async () => {
    const { saveCourtOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      ...validSameTimeForm(),
      sameOpeningHour: '18',
      sameOpeningMinute: '00',
      sameClosingHour: '17',
      sameClosingMinute: '00',
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCourtOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toEqual(
      expect.arrayContaining([
        { href: '#sameOpeningHour', text: 'The opening time cannot be after the closing time' },
        { href: '#sameClosingHour', text: 'The closing time cannot be before the opening time' },
      ])
    );
  });

  test('rejects opening times that are the same as closing times for Monday to Friday', async () => {
    const { saveCourtOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      ...validSameTimeForm(),
      sameOpeningHour: '10',
      sameOpeningMinute: '10',
      sameClosingHour: '10',
      sameClosingMinute: '10',
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCourtOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toEqual(
      expect.arrayContaining([
        { href: '#sameOpeningHour', text: 'The opening time cannot be the same as the closing time' },
        { href: '#sameClosingHour', text: 'The closing time cannot be the same as the opening time' },
      ])
    );
  });

  test('rejects opening times that are the same as closing times for selected weekdays', async () => {
    const { saveCourtOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      openingHourTypeId: tribunalOpenType.id,
      sameTime: 'no',
      selectedDays: ['MONDAY'],
      mondayOpeningHour: '10',
      mondayOpeningMinute: '10',
      mondayClosingHour: '10',
      mondayClosingMinute: '10',
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCourtOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toEqual(
      expect.arrayContaining([
        { href: '#mondayOpeningHour', text: 'The opening time cannot be the same as the closing time' },
        { href: '#mondayClosingHour', text: 'The closing time cannot be the same as the opening time' },
      ])
    );
  });

  test('requires at least one weekday when different opening times are selected', async () => {
    const { saveCourtOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      openingHourTypeId: tribunalOpenType.id,
      sameTime: 'no',
      selectedDays: [],
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCourtOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toContainEqual({
      href: '#selectedDays',
      text: 'Select at least one day',
    });
  });

  test('requires an opening hour type and same-time selection', async () => {
    const { saveCourtOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      selectedDays: [],
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCourtOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toEqual([
      { href: '#openingHourTypeId', text: 'Select an opening hours type' },
      {
        href: '#sameTimeYes',
        text: 'Select whether the court opens and closes at the same time Monday to Friday',
      },
    ]);
  });

  test('rejects missing and out-of-range weekday time parts', async () => {
    const { saveCourtOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      openingHourTypeId: tribunalOpenType.id,
      sameTime: 'no',
      selectedDays: ['MONDAY'],
      mondayOpeningHour: '24',
      mondayOpeningMinute: '',
      mondayClosingHour: '16',
      mondayClosingMinute: '99',
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCourtOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toEqual(
      expect.arrayContaining([
        { href: '#mondayOpeningHour', text: 'Monday opening hour must be between 0 and 23' },
        { href: '#mondayOpeningMinute', text: 'Enter the monday opening minute' },
        { href: '#mondayClosingMinute', text: 'Monday closing minute must be between 0 and 59' },
      ])
    );
  });

  test('passes through court lookup errors on the list page', async () => {
    const { service } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    await expect(service.getListPage(courtId)).resolves.toBe(HttpStatusCode.NotFound);
  });

  test('passes through unexpected opening-hours list errors', async () => {
    const { service } = buildService({
      getCourtOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    });

    await expect(service.getListPage(courtId)).resolves.toBe(HttpStatusCode.InternalServerError);
  });

  test('returns no opening hours on the list page when the API returns 204', async () => {
    const { service } = buildService({
      getCourtOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.NoContent),
    });

    const result = await service.getListPage(courtId);

    expect(result).toMatchObject({
      courtId,
      courtName: 'Reading Crown Court',
      openingHours: [],
    });
  });

  test('returns no opening hours on the list page when the API returns 404 after the court exists', async () => {
    const { service } = buildService({
      getCourtOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    const result = await service.getListPage(courtId);

    expect(result).toMatchObject({
      courtId,
      courtName: 'Reading Crown Court',
      openingHours: [],
    });
  });

  test('resolves opening hour type ids and formats API times on the list page', async () => {
    const { service } = buildService({
      getCourtOpeningHours: jest.fn().mockResolvedValue([
        {
          id: openingHoursId,
          courtId,
          openingHourTypeId: courtOpenType.id,
          openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00:00', closingTime: '16:30:00' }],
        },
      ]),
    });

    const result = await service.getListPage(courtId);

    expect(result).toMatchObject({
      openingHours: [
        {
          hours: 'Monday to Friday: 09:00 to 16:30',
          openingHourType: 'Court open',
        },
      ],
    });
  });

  test('falls back to the opening hour type id when the type lookup cannot resolve it', async () => {
    const unknownTypeId = '99999999-9999-4999-8999-999999999999';
    const { service } = buildService({
      getOpeningHourTypes: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      getCourtOpeningHours: jest.fn().mockResolvedValue([
        {
          id: openingHoursId,
          courtId,
          openingHourTypeId: unknownTypeId,
          openingTimesDetails: [{ dayOfWeek: 'SATURDAY', openingTime: '09:00', closingTime: '12:00' }],
        },
      ]),
    });

    const result = await service.getListPage(courtId);

    expect(result).toMatchObject({
      openingHours: [
        {
          hours: 'SATURDAY: 09:00 to 12:00',
          openingHourType: unknownTypeId,
        },
      ],
    });
  });

  test('prepopulates the edit page for Monday to Friday opening hours', async () => {
    const { service } = buildService({
      getCourtOpeningHoursById: jest.fn().mockResolvedValue({
        id: openingHoursId,
        courtId,
        openingHourTypeId: courtOpenType.id,
        openingHourType: courtOpenType,
        openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:30' }],
      }),
    });

    const result = await service.getEditPage(courtId, openingHoursId);

    expect(result).toMatchObject({
      form: {
        openingHourTypeId: courtOpenType.id,
        sameTime: 'yes',
        sameOpeningHour: '9',
        sameOpeningMinute: '00',
        sameClosingHour: '17',
        sameClosingMinute: '30',
      },
      openingHoursId,
    });
  });

  test('prepopulates the edit page for selected weekdays and keeps an unknown current type selectable', async () => {
    const unknownType = {
      id: '99999999-9999-4999-8999-999999999999',
      name: 'Legacy opening type',
      nameCy: null,
    };
    const { service } = buildService({
      getOpeningHourTypes: jest.fn().mockResolvedValue([courtOpenType, unknownType, tribunalOpenType]),
      getCourtOpeningHoursById: jest.fn().mockResolvedValue({
        id: openingHoursId,
        courtId,
        openingHourTypeId: unknownType.id,
        openingHourType: unknownType,
        openingTimesDetails: [
          { dayOfWeek: 'MONDAY', openingTime: '09:15', closingTime: '12:45' },
          { dayOfWeek: 'SATURDAY', openingTime: '10:00', closingTime: '12:00' },
        ],
      }),
    });

    const result = await service.getEditPage(courtId, openingHoursId);

    expect(result).toMatchObject({
      form: {
        openingHourTypeId: unknownType.id,
        sameTime: 'no',
        selectedDays: ['MONDAY', 'SATURDAY'],
        mondayOpeningHour: '9',
        mondayOpeningMinute: '15',
        mondayClosingHour: '12',
        mondayClosingMinute: '45',
      },
      openingHourTypes: [courtOpenType, tribunalOpenType, unknownType],
    });
  });

  test('sorts multiple legacy current type entries alphabetically when prepopulating the edit page', async () => {
    const legacyTypeA = {
      id: '99999999-9999-4999-8999-999999999999',
      name: 'Z legacy opening type',
      nameCy: null,
    };
    const legacyTypeB = {
      id: legacyTypeA.id,
      name: 'A legacy opening type',
      nameCy: null,
    };
    const { service } = buildService({
      getOpeningHourTypes: jest.fn().mockResolvedValue([legacyTypeA, legacyTypeB]),
      getCourtOpeningHoursById: jest.fn().mockResolvedValue({
        id: openingHoursId,
        courtId,
        openingHourTypeId: legacyTypeA.id,
        openingHourType: legacyTypeA,
        openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
      }),
    });

    const result = await service.getEditPage(courtId, openingHoursId);

    expect(result).toMatchObject({
      openingHourTypes: [legacyTypeB, legacyTypeA],
    });
  });

  test('passes through edit page dependency errors', async () => {
    const { service: courtErrorService } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });
    const { service: typesErrorService } = buildService({
      getOpeningHourTypes: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    });
    const { service: openingHoursErrorService } = buildService({
      getCourtOpeningHoursById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    await expect(courtErrorService.getEditPage(courtId)).resolves.toBe(HttpStatusCode.NotFound);
    await expect(typesErrorService.getEditPage(courtId)).resolves.toBe(HttpStatusCode.InternalServerError);
    await expect(openingHoursErrorService.getEditPage(courtId, openingHoursId)).resolves.toBe(HttpStatusCode.NotFound);
  });

  test('passes through save dependency and persistence errors', async () => {
    const { service: baseModelErrorService } = buildService({
      getOpeningHourTypes: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    });
    const { service: existingLookupErrorService } = buildService({
      getCourtOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    });
    const { service: saveStatusErrorService } = buildService({
      saveCourtOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.BadGateway),
    });
    const { service: saveMapErrorService } = buildService({
      saveCourtOpeningHours: jest.fn().mockResolvedValue(new Map([['field', 'error']])),
    });

    await expect(baseModelErrorService.save(courtId, undefined, validSameTimeForm())).resolves.toEqual({
      status: HttpStatusCode.InternalServerError,
      type: 'status',
    });
    await expect(existingLookupErrorService.save(courtId, undefined, validSameTimeForm())).resolves.toEqual({
      status: HttpStatusCode.InternalServerError,
      type: 'status',
    });
    await expect(saveStatusErrorService.save(courtId, undefined, validSameTimeForm())).resolves.toEqual({
      status: HttpStatusCode.BadGateway,
      type: 'status',
    });
    await expect(saveMapErrorService.save(courtId, undefined, validSameTimeForm())).resolves.toEqual({
      status: HttpStatusCode.BadRequest,
      type: 'status',
    });
  });

  test('allows saving a first opening hour when the existing opening-hours lookup returns 404', async () => {
    const { saveCourtOpeningHours, service } = buildService({
      getCourtOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
      saveCourtOpeningHours: jest.fn().mockResolvedValue({
        id: openingHoursId,
        courtId,
        openingHourTypeId: courtOpenType.id,
        openingHourType: courtOpenType,
        openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
      }),
    });

    const result = await service.save(courtId, undefined, validSameTimeForm());

    expect(result.type).toBe('success');
    expect(saveCourtOpeningHours).toHaveBeenCalled();
  });

  test('filters no counter service available from the edit page type dropdown', async () => {
    const { service } = buildService({
      getOpeningHourTypes: jest.fn().mockResolvedValue([
        courtOpenType,
        {
          id: '55555555-5555-4555-8555-555555555555',
          name: 'No counter service available',
          nameCy: 'CHANGE ME / NEED WELSH',
        },
      ]),
    });

    const result = await service.getEditPage(courtId);

    expect(result).toMatchObject({
      openingHourTypes: [courtOpenType],
    });
  });

  test('builds the delete confirmation page and delete success payload', async () => {
    const deleteCourtOpeningHours = jest.fn().mockResolvedValue(HttpStatusCode.NoContent);
    const { service } = buildService({
      deleteCourtOpeningHours,
      getCourtOpeningHoursById: jest.fn().mockResolvedValue({
        id: openingHoursId,
        courtId,
        openingHourTypeId: courtOpenType.id,
        openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00:00', closingTime: '17:00:00' }],
      }),
    });

    await expect(service.getDeletePage(courtId, openingHoursId)).resolves.toMatchObject({
      courtId,
      courtName: 'Reading Crown Court',
      hours: 'Monday to Friday: 09:00 to 17:00',
      openingHourType: 'Court open',
      openingHoursId,
    });
    await expect(service.delete(courtId, openingHoursId)).resolves.toMatchObject({
      courtId,
      courtName: 'Reading Crown Court',
      openingHourType: 'Court open',
    });
    expect(deleteCourtOpeningHours).toHaveBeenCalledWith(courtId, openingHoursId);
  });

  test('passes through delete page and delete API errors', async () => {
    const { service: courtErrorService } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });
    const { service: openingHoursErrorService } = buildService({
      getCourtOpeningHoursById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });
    const { service: deleteErrorService } = buildService({
      deleteCourtOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
      getCourtOpeningHoursById: jest.fn().mockResolvedValue({
        id: openingHoursId,
        courtId,
        openingHourTypeId: courtOpenType.id,
        openingHourType: courtOpenType,
        openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
      }),
    });

    await expect(courtErrorService.getDeletePage(courtId, openingHoursId)).resolves.toBe(HttpStatusCode.NotFound);
    await expect(openingHoursErrorService.getDeletePage(courtId, openingHoursId)).resolves.toBe(
      HttpStatusCode.NotFound
    );
    await expect(openingHoursErrorService.delete(courtId, openingHoursId)).resolves.toBe(HttpStatusCode.NotFound);
    await expect(deleteErrorService.delete(courtId, openingHoursId)).resolves.toBe(HttpStatusCode.InternalServerError);
  });

  function validSameTimeForm(): OpeningHoursForm {
    return {
      openingHourTypeId: courtOpenType.id,
      sameTime: 'yes',
      selectedDays: [],
      sameOpeningHour: '9',
      sameOpeningMinute: '00',
      sameClosingHour: '17',
      sameClosingMinute: '00',
    };
  }
});
