import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { WarningNoticeForm, WarningNoticeService } from '../../../main/services/WarningNoticeService';

describe('WarningNoticeService', () => {
  const courtId = '11111111-1111-4111-8111-111111111111';
  const courtResponse = {
    id: courtId,
    name: 'Reading Crown Court',
    warningNotice: 'Current warning',
    warningNoticeCy: 'Rhybudd presennol',
  };

  function buildService(overrides: Partial<DataApiRequests> = {}) {
    const dataApiRequests = {
      getCourtById: jest.fn().mockResolvedValue(courtResponse),
      updateCourt: jest.fn().mockResolvedValue({}),
      ...overrides,
    } as unknown as DataApiRequests;

    return {
      dataApiRequests,
      getCourtById: dataApiRequests.getCourtById as jest.Mock,
      updateCourt: dataApiRequests.updateCourt as jest.Mock,
      service: new WarningNoticeService(dataApiRequests),
    };
  }

  test('returns warning notice page view model', async () => {
    const { getCourtById, service } = buildService();

    const result = await service.getWarningNoticePage(courtId);

    expect(getCourtById).toHaveBeenCalledWith(courtId);
    expect(result).toEqual({
      courtId,
      courtName: 'Reading Crown Court',
      form: {
        warningNotice: 'Current warning',
        warningNoticeCy: 'Rhybudd presennol',
      },
      errors: {},
      errorSummary: [],
      pageTitle: 'Warning notice - Reading Crown Court',
    });
  });

  test('returns upstream status when court lookup fails on getPage', async () => {
    const { service } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    });

    const result = await service.getWarningNoticePage(courtId);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('returns status when court lookup fails on save', async () => {
    const { updateCourt, service } = buildService({
      getCourtById: jest.fn().mockResolvedValue(HttpStatusCode.NotFound),
    });

    const result = await service.save(courtId, {
      warningNotice: 'Message',
      warningNoticeCy: 'Neges',
    });

    expect(result).toEqual({
      type: 'status',
      status: HttpStatusCode.NotFound,
    });
    expect(updateCourt).not.toHaveBeenCalled();
  });

  test('returns validation_error when english warning notice is provided without welsh translation', async () => {
    const { updateCourt, service } = buildService();

    const result = await service.save(courtId, {
      warningNotice: 'Fire alarm out of service',
      warningNoticeCy: undefined,
    });

    expect(result).toEqual({
      type: 'validation_error',
      viewModel: {
        courtId,
        courtName: 'Reading Crown Court',
        form: {
          warningNotice: 'Fire alarm out of service',
          warningNoticeCy: undefined,
        },
        errors: {
          warningNoticeCy: 'Because you provided an explanation in English, the Welsh translation is now mandatory',
        },
        errorSummary: [
          {
            href: '#warningNoticeCy',
            text: 'Because you provided an explanation in English, the Welsh translation is now mandatory',
          },
        ],
        pageTitle: 'Error: Warning notice - Reading Crown Court',
      },
    });
    expect(updateCourt).not.toHaveBeenCalled();
  });

  test('returns validation_error when welsh warning notice is provided without english translation', async () => {
    const { updateCourt, service } = buildService();

    const result = await service.save(courtId, {
      warningNotice: undefined,
      warningNoticeCy: 'Rhybudd yn unig',
    });

    expect(result).toEqual({
      type: 'validation_error',
      viewModel: {
        courtId,
        courtName: 'Reading Crown Court',
        form: {
          warningNotice: undefined,
          warningNoticeCy: 'Rhybudd yn unig',
        },
        errors: {
          warningNotice: 'Because you provided an explanation in Welsh, the English translation is now mandatory',
        },
        errorSummary: [
          {
            href: '#warningNotice',
            text: 'Because you provided an explanation in Welsh, the English translation is now mandatory',
          },
        ],
        pageTitle: 'Error: Warning notice - Reading Crown Court',
      },
    });
    expect(updateCourt).not.toHaveBeenCalled();
  });

  test('returns validation_error when warning notices exceed max length', async () => {
    const { updateCourt, service } = buildService();
    const longText = 'a'.repeat(251);
    const longWelshText = 'b'.repeat(251);

    const result = await service.save(courtId, {
      warningNotice: longText,
      warningNoticeCy: longWelshText,
    });

    expect(result).toEqual({
      type: 'validation_error',
      viewModel: {
        courtId,
        courtName: 'Reading Crown Court',
        form: {
          warningNotice: longText,
          warningNoticeCy: longWelshText,
        },
        errors: {
          warningNotice: 'Warning notice must be 250 characters or less',
          warningNoticeCy: 'Welsh warning notice must be 250 characters or less',
        },
        errorSummary: [
          { href: '#warningNotice', text: 'Warning notice must be 250 characters or less' },
          { href: '#warningNoticeCy', text: 'Welsh warning notice must be 250 characters or less' },
        ],
        pageTitle: 'Error: Warning notice - Reading Crown Court',
      },
    });
    expect(updateCourt).not.toHaveBeenCalled();
  });

  test('returns validation_error when warning notices contain invalid characters', async () => {
    const { updateCourt, service } = buildService();

    const result = await service.save(courtId, {
      warningNotice: 'Temporary closure @ 5pm',
      warningNoticeCy: 'Cau dros dro @ 5pm',
    });

    expect(result).toEqual({
      type: 'validation_error',
      viewModel: {
        courtId,
        courtName: 'Reading Crown Court',
        form: {
          warningNotice: 'Temporary closure @ 5pm',
          warningNoticeCy: 'Cau dros dro @ 5pm',
        },
        errors: {
          warningNotice:
            'Warning notice must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses',
          warningNoticeCy:
            'Welsh warning notice must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses',
        },
        errorSummary: [
          {
            href: '#warningNotice',
            text: 'Warning notice must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses',
          },
          {
            href: '#warningNoticeCy',
            text: 'Welsh warning notice must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses',
          },
        ],
        pageTitle: 'Error: Warning notice - Reading Crown Court',
      },
    });
    expect(updateCourt).not.toHaveBeenCalled();
  });

  test('returns status when updateCourt returns an error status', async () => {
    const { service } = buildService({
      updateCourt: jest.fn().mockResolvedValue(HttpStatusCode.InternalServerError),
    });

    const result = await service.save(courtId, {
      warningNotice: 'Fire alarm out of service',
      warningNoticeCy: 'Larwm tân allan o wasanaeth',
    });

    expect(result).toEqual({
      type: 'status',
      status: HttpStatusCode.InternalServerError,
    });
  });

  test('trims and saves warning notices, returning success', async () => {
    const { updateCourt, service } = buildService({
      updateCourt: jest.fn().mockResolvedValue({ id: courtId }),
    });

    const form: WarningNoticeForm = {
      warningNotice: '  Fire alarm out of service  ',
      warningNoticeCy: '  Larwm tân allan o wasanaeth  ',
    };

    const result = await service.save(courtId, form);

    expect(updateCourt).toHaveBeenCalledWith(
      expect.objectContaining({
        id: courtId,
        warningNotice: 'Fire alarm out of service',
        warningNoticeCy: 'Larwm tân allan o wasanaeth',
      })
    );
    expect(result).toEqual({
      type: 'success',
      viewModel: {
        courtId,
        courtName: 'Reading Crown Court',
      },
    });
  });

  test('saves null warning notices when only whitespace is submitted', async () => {
    const { updateCourt, service } = buildService({
      updateCourt: jest.fn().mockResolvedValue({ id: courtId }),
    });

    const result = await service.save(courtId, {
      warningNotice: '   ',
      warningNoticeCy: '   ',
    });

    expect(updateCourt).toHaveBeenCalledWith(
      expect.objectContaining({
        warningNotice: null,
        warningNoticeCy: null,
      })
    );
    expect(result.type).toBe('success');
  });
});
