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
