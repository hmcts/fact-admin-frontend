import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import {
  CounterServiceOpeningHoursForm,
  CounterServiceOpeningHoursService,
  SaveCounterServiceOpeningHoursResult,
} from '../../../main/services/CounterServiceOpeningHoursService';

type ValidationErrorResult = Extract<SaveCounterServiceOpeningHoursResult, { type: 'validation_error' }>;

describe('CounterServiceOpeningHoursService', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const counterServiceId = '22222222-2222-4222-8222-222222222222';

  const existingRecord = {
    id: counterServiceId,
    courtId,
    counterService: true,
    courtTypes: [],
    assistWithForms: true,
    assistWithDocuments: false,
    assistWithSupport: false,
    appointmentNeeded: false,
    appointmentContact: null,
    openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00:00', closingTime: '17:00:00' }],
  };

  function buildService(overrides: Partial<DataApiRequests> = {}) {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue({ id: courtId, name: 'Reading Crown Court' }),
      getCounterServiceOpeningHours: jest.fn().mockResolvedValue([existingRecord]),
      getCounterServiceOpeningHoursById: jest.fn().mockResolvedValue(existingRecord),
      saveCounterServiceOpeningHours: jest.fn(),
      deleteCounterServiceOpeningHours: jest.fn(),
      ...overrides,
    } as unknown as DataApiRequests;

    return {
      dataApiRequests,
      saveCounterServiceOpeningHours: dataApiRequests.saveCounterServiceOpeningHours as jest.Mock,
      deleteCounterServiceOpeningHours: dataApiRequests.deleteCounterServiceOpeningHours as jest.Mock,
      service: new CounterServiceOpeningHoursService(dataApiRequests),
    };
  }

  function validSameTimeForm(): CounterServiceOpeningHoursForm {
    return {
      assistWith: ['forms'],
      appointmentNeeded: 'no',
      sameTime: 'yes',
      selectedDays: [],
      sameOpeningHour: '9',
      sameOpeningMinute: '00',
      sameClosingHour: '17',
      sameClosingMinute: '00',
    };
  }

  test('normalises selected day values from request body input', () => {
    const { service } = buildService();

    expect(service.getSelectedDays('MONDAY')).toEqual(['MONDAY']);
    expect(service.getSelectedDays(['MONDAY', 1, 'TUESDAY'])).toEqual(['MONDAY', 'TUESDAY']);
    expect(service.getSelectedDays(undefined)).toEqual([]);
  });

  test('getListPage returns status when court lookup fails', async () => {
    const { service } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    const result = await service.getListPage(courtId);

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('getListPage returns empty list when counter service returns no content', async () => {
    const { service } = buildService({
      getCounterServiceOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.NoContent),
    });

    const result = await service.getListPage(courtId);

    expect(result).toEqual({
      courtId,
      courtName: 'Reading Crown Court',
      counterServiceOpeningHours: [],
      pageTitle: 'Counter service opening hours - Reading Crown Court',
    });
  });

  test('getListPage returns mapped list of counter service opening hours', async () => {
    const { service } = buildService();

    const result = await service.getListPage(courtId);

    expect(result).toEqual({
      courtId,
      courtName: 'Reading Crown Court',
      counterServiceOpeningHours: [
        {
          id: counterServiceId,
          assistanceAvailable: 'Forms',
          appointmentNeeded: 'No',
          hours: 'Monday to Friday: 9am to 5pm',
        },
      ],
      pageTitle: 'Counter service opening hours - Reading Crown Court',
    });
  });

  test('getEditPage returns status when court lookup fails', async () => {
    const { service } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    const result = await service.getEditPage(courtId);

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('getEditPage returns blank form for add', async () => {
    const { service } = buildService();

    const result = await service.getEditPage(courtId);

    expect(result).toMatchObject({
      courtId,
      courtName: 'Reading Crown Court',
      errors: {},
      errorSummary: [],
      form: { assistWith: [], selectedDays: [] },
      pageTitle: 'Edit counter service opening hours - Reading Crown Court',
    });
  });

  test('getEditPage returns pre-filled form for edit', async () => {
    const { service } = buildService();

    const result = await service.getEditPage(courtId, counterServiceId);

    expect(result).toMatchObject({
      courtId,
      courtName: 'Reading Crown Court',
      counterServiceId,
      form: {
        assistWith: ['forms'],
        appointmentNeeded: 'no',
        sameTime: 'yes',
        sameOpeningHour: '09',
        sameOpeningMinute: '00',
        sameClosingHour: '17',
        sameClosingMinute: '00',
      },
    });
  });

  test('getEditPage returns pre-filled form for selected weekday opening hours', async () => {
    const { service } = buildService({
      getCounterServiceOpeningHoursById: jest.fn().mockResolvedValue({
        ...existingRecord,
        assistWithForms: false,
        assistWithDocuments: true,
        assistWithSupport: true,
        appointmentNeeded: true,
        appointmentContact: 'appointments@example.test',
        openingTimesDetails: [
          { dayOfWeek: 'MONDAY', openingTime: '10:15:00', closingTime: '16:45:00' },
          { dayOfWeek: 'WEDNESDAY', openingTime: '09:00:00', closingTime: '12:30:00' },
        ],
      }),
    });

    const result = await service.getEditPage(courtId, counterServiceId);

    expect(result).toMatchObject({
      form: {
        assistWith: ['documents', 'support'],
        appointmentNeeded: 'yes',
        appointmentContact: 'appointments@example.test',
        sameTime: 'no',
        selectedDays: ['MONDAY', 'WEDNESDAY'],
        mondayOpeningHour: '10',
        mondayOpeningMinute: '15',
        mondayClosingHour: '16',
        mondayClosingMinute: '45',
        wednesdayOpeningHour: '09',
        wednesdayOpeningMinute: '00',
        wednesdayClosingHour: '12',
        wednesdayClosingMinute: '30',
      },
    });
  });

  test('saves Monday to Friday opening hours as EVERYDAY when the same-time option is selected', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService({
      saveCounterServiceOpeningHours: jest.fn().mockResolvedValue({
        ...existingRecord,
        openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00:00', closingTime: '17:00:00' }],
      }),
    });

    const result = await service.save(courtId, counterServiceId, validSameTimeForm());

    expect(result.type).toBe('success');
    expect(saveCounterServiceOpeningHours).toHaveBeenCalledWith(courtId, {
      courtId,
      id: counterServiceId,
      counterService: true,
      assistWithForms: true,
      assistWithDocuments: false,
      assistWithSupport: false,
      appointmentNeeded: false,
      appointmentContact: null,
      openingTimesDetails: [{ dayOfWeek: 'EVERYDAY', openingTime: '09:00', closingTime: '17:00' }],
    });
  });

  test('saves selected weekdays when different opening times are selected', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService({
      saveCounterServiceOpeningHours: jest.fn().mockResolvedValue({
        ...existingRecord,
        openingTimesDetails: [{ dayOfWeek: 'MONDAY', openingTime: '10:15:00', closingTime: '16:45:00' }],
      }),
    });

    const result = await service.save(courtId, undefined, {
      assistWith: ['forms'],
      appointmentNeeded: 'no',
      sameTime: 'no',
      selectedDays: ['MONDAY'],
      mondayOpeningHour: '10',
      mondayOpeningMinute: '15',
      mondayClosingHour: '16',
      mondayClosingMinute: '45',
    });

    expect(result.type).toBe('success');
    expect(saveCounterServiceOpeningHours).toHaveBeenCalledWith(courtId, {
      courtId,
      id: undefined,
      counterService: true,
      assistWithForms: true,
      assistWithDocuments: false,
      assistWithSupport: false,
      appointmentNeeded: false,
      appointmentContact: null,
      openingTimesDetails: [{ dayOfWeek: 'MONDAY', openingTime: '10:15', closingTime: '16:45' }],
    });
  });

  test('saves appointment contact when appointment is needed', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService({
      saveCounterServiceOpeningHours: jest.fn().mockResolvedValue({
        ...existingRecord,
        appointmentNeeded: true,
        appointmentContact: 'test@test.com',
      }),
    });

    const result = await service.save(courtId, undefined, {
      assistWith: ['forms'],
      appointmentNeeded: 'yes',
      appointmentContact: 'test@test.com',
      sameTime: 'yes',
      selectedDays: [],
      sameOpeningHour: '9',
      sameOpeningMinute: '00',
      sameClosingHour: '17',
      sameClosingMinute: '00',
    });

    expect(result.type).toBe('success');
    expect(saveCounterServiceOpeningHours).toHaveBeenCalledWith(
      courtId,
      expect.objectContaining({
        appointmentNeeded: true,
        appointmentContact: 'test@test.com',
      })
    );
  });

  test('saves null appointment contact when appointment is not needed', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService({
      saveCounterServiceOpeningHours: jest.fn().mockResolvedValue(existingRecord),
    });

    await service.save(courtId, undefined, validSameTimeForm());

    expect(saveCounterServiceOpeningHours).toHaveBeenCalledWith(
      courtId,
      expect.objectContaining({
        appointmentNeeded: false,
        appointmentContact: null,
      })
    );
  });

  test('treats a no-content response from save as success', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService({
      getCounterServiceOpeningHoursById: jest.fn().mockResolvedValue(existingRecord),
      saveCounterServiceOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.NoContent),
    });

    const result = await service.save(courtId, counterServiceId, validSameTimeForm());

    expect(result).toEqual({
      type: 'success',
      viewModel: {
        courtId,
        courtName: 'Reading Crown Court',
        assistanceAvailable: 'Forms',
      },
    });
    expect(saveCounterServiceOpeningHours).toHaveBeenCalled();
  });

  test('returns status when save court lookup fails', async () => {
    const { service } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    const result = await service.save(courtId, undefined, validSameTimeForm());

    expect(result).toMatchObject({ status: HttpStatusCode.NotFound, type: 'status' });
  });

  test('requires at least one assistance type', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      ...validSameTimeForm(),
      assistWith: [],
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCounterServiceOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toContainEqual({
      href: '#assistWith',
      text: 'Select what the counter can assist with',
    });
  });

  test('requires appointment needed selection', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      ...validSameTimeForm(),
      appointmentNeeded: undefined,
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCounterServiceOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toContainEqual({
      href: '#appointmentNeeded',
      text: 'Select yes if an appointment is needed',
    });
  });

  test('requires same-time selection', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      assistWith: ['forms'],
      appointmentNeeded: 'no',
      selectedDays: [],
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCounterServiceOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toContainEqual({
      href: '#sameTimeYes',
      text: 'Select whether the counter opens and closes at the same time Monday to Friday',
    });
  });

  test('requires at least one weekday when different opening times are selected', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      assistWith: ['forms'],
      appointmentNeeded: 'no',
      sameTime: 'no',
      selectedDays: [],
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCounterServiceOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toContainEqual({
      href: '#selectedDays',
      text: 'Select at least one day',
    });
  });

  test('rejects opening times after closing times', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      ...validSameTimeForm(),
      sameOpeningHour: '18',
      sameOpeningMinute: '00',
      sameClosingHour: '17',
      sameClosingMinute: '00',
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCounterServiceOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toEqual(
      expect.arrayContaining([
        { href: '#sameOpeningHour', text: 'The opening time cannot be after the closing time' },
        { href: '#sameClosingHour', text: 'The closing time cannot be before the opening time' },
      ])
    );
  });

  test('rejects opening times that equal closing times', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      ...validSameTimeForm(),
      sameOpeningHour: '10',
      sameOpeningMinute: '00',
      sameClosingHour: '10',
      sameClosingMinute: '00',
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCounterServiceOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toEqual(
      expect.arrayContaining([
        { href: '#sameOpeningHour', text: 'The opening time cannot be the same as the closing time' },
        { href: '#sameClosingHour', text: 'The closing time cannot be the same as the opening time' },
      ])
    );
  });

  test('rejects out-of-range time parts', async () => {
    const { saveCounterServiceOpeningHours, service } = buildService();

    const result = await service.save(courtId, undefined, {
      ...validSameTimeForm(),
      sameOpeningHour: '24',
      sameOpeningMinute: '60',
      sameClosingHour: '24',
      sameClosingMinute: '60',
    });
    const validationResult = result as ValidationErrorResult;

    expect(result.type).toBe('validation_error');
    expect(saveCounterServiceOpeningHours).not.toHaveBeenCalled();
    expect(validationResult.viewModel.errorSummary).toEqual(
      expect.arrayContaining([
        { href: '#sameOpeningHour', text: 'Opening hour must be between 0 and 23' },
        { href: '#sameOpeningMinute', text: 'Opening minute must be between 0 and 59' },
        { href: '#sameClosingHour', text: 'Closing hour must be between 0 and 23' },
        { href: '#sameClosingMinute', text: 'Closing minute must be between 0 and 59' },
      ])
    );
  });

  test('getDeletePage returns status when court lookup fails', async () => {
    const { service } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    const result = await service.getDeletePage(courtId, counterServiceId);

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('getDeletePage returns status when counter service lookup fails', async () => {
    const { service } = buildService({
      getCounterServiceOpeningHoursById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    const result = await service.getDeletePage(courtId, counterServiceId);

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('getDeletePage returns delete view model with formatted data', async () => {
    const { service } = buildService();

    const result = await service.getDeletePage(courtId, counterServiceId);

    expect(result).toEqual({
      courtId,
      courtName: 'Reading Crown Court',
      counterServiceId,
      assistanceAvailable: 'Forms',
      hours: 'Monday to Friday: 9am to 5pm',
      pageTitle: 'Delete counter service opening hours - Reading Crown Court',
    });
  });

  test('delete returns status when getDeletePage fails', async () => {
    const { service } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    const result = await service.delete(courtId, counterServiceId);

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('delete returns status when delete request fails', async () => {
    const { service } = buildService({
      deleteCounterServiceOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    });

    const result = await service.delete(courtId, counterServiceId);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('delete returns success view model after successful deletion', async () => {
    const { deleteCounterServiceOpeningHours, service } = buildService({
      deleteCounterServiceOpeningHours: jest.fn().mockResolvedValue(HttpStatusCode.Ok),
    });

    const result = await service.delete(courtId, counterServiceId);

    expect(deleteCounterServiceOpeningHours).toHaveBeenCalledWith(courtId, counterServiceId);
    expect(result).toEqual({
      courtId,
      courtName: 'Reading Crown Court',
      assistanceAvailable: 'Forms',
    });
  });
});
