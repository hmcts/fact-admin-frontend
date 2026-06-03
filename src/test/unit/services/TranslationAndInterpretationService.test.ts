import { HttpStatusCode } from 'axios';
import { restore, stub } from 'sinon';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { TranslationAndInterpretationService } from '../../../main/services/TranslationAndInterpretationService';

const courtId = '11111111-1111-4111-8111-111111111111';

describe('TranslationAndInterpretationService', () => {
  beforeEach(() => {
    restore();
  });

  test('builds a view model with checked options for existing values', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getTranslationServices').resolves({
      courtId,
      email: 'translations@example.com',
      id: '22222222-2222-4222-8222-222222222222',
      phoneNumber: '+441234 567890',
    });

    const viewModel = await new TranslationAndInterpretationService().getViewModel(courtId);

    expect(viewModel).toEqual({
      courtId,
      courtName: 'Reading Crown Court',
      email: 'translations@example.com',
      emailSelected: true,
      errorSummary: [],
      phoneNumber: '+441234 567890',
      phoneNumberSelected: true,
    });
  });

  test('treats missing, null and empty translation services as unchecked options', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    stub(DataApiRequests.prototype, 'getTranslationServices').resolves({
      courtId,
      email: null,
      phoneNumber: '',
    });

    const viewModel = await new TranslationAndInterpretationService().getViewModel(courtId);

    expect(viewModel).toMatchObject({
      email: '',
      emailSelected: false,
      phoneNumber: '',
      phoneNumberSelected: false,
    });
  });

  test('saves empty strings for unselected contact methods', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveTranslationServicesStub = stub(DataApiRequests.prototype, 'saveTranslationServices').resolves(
      HttpStatusCode.NoContent
    );

    const result = await new TranslationAndInterpretationService().save(courtId, {});

    expect(result).toMatchObject({
      status: 'saved',
      viewModel: {
        courtId,
        courtName: 'Reading Crown Court',
      },
    });
    expect(saveTranslationServicesStub.calledWith(courtId, { courtId, email: '', phoneNumber: '' })).toBe(true);
  });

  test('saves selected contact values and ignores unselected values', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveTranslationServicesStub = stub(DataApiRequests.prototype, 'saveTranslationServices').resolves(
      HttpStatusCode.NoContent
    );

    const result = await new TranslationAndInterpretationService().save(courtId, {
      contactMethods: ['email'],
      email: ' translations@example.com ',
      phoneNumber: '+441234 567890',
    });

    expect(result).toMatchObject({
      status: 'saved',
      viewModel: {
        courtId,
        courtName: 'Reading Crown Court',
      },
    });
    expect(
      saveTranslationServicesStub.calledWith(courtId, {
        courtId,
        email: 'translations@example.com',
        phoneNumber: '',
      })
    ).toBe(true);
  });

  test('returns validation errors when selected contact values are empty', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveTranslationServicesStub = stub(DataApiRequests.prototype, 'saveTranslationServices');

    const result = await new TranslationAndInterpretationService().save(courtId, {
      contactMethods: ['email', 'phoneNumber'],
      email: ' ',
      phoneNumber: '',
    });

    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        emailError: 'Enter an email address',
        emailSelected: true,
        errorSummary: [
          { href: '#email', text: 'Enter an email address' },
          { href: '#phoneNumber', text: 'Enter a telephone number' },
        ],
        phoneNumberError: 'Enter a telephone number',
        phoneNumberSelected: true,
      },
    });
    expect(saveTranslationServicesStub.notCalled).toBe(true);
  });

  test('returns validation errors without saving invalid selected values', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveTranslationServicesStub = stub(DataApiRequests.prototype, 'saveTranslationServices');

    const result = await new TranslationAndInterpretationService().save(courtId, {
      contactMethods: ['email', 'phoneNumber'],
      email: 'invalid',
      phoneNumber: 'abc',
    });

    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        errorSummary: [
          { href: '#email', text: 'Enter an email address in the correct format' },
          { href: '#phoneNumber', text: 'Enter a telephone number in the correct format' },
        ],
      },
    });
    expect(saveTranslationServicesStub.notCalled).toBe(true);
  });

  test('returns validation errors when an email domain contains consecutive dots', async () => {
    stub(DataApiRequests.prototype, 'getCourtById').resolves({
      id: courtId,
      name: 'Reading Crown Court',
    } as never);
    const saveTranslationServicesStub = stub(DataApiRequests.prototype, 'saveTranslationServices');

    const result = await new TranslationAndInterpretationService().save(courtId, {
      contactMethods: ['email'],
      email: 'test.user@email..com',
    });

    expect(result).toMatchObject({
      status: 'validationError',
      viewModel: {
        errorSummary: [{ href: '#email', text: 'Enter an email address in the correct format' }],
      },
    });
    expect(saveTranslationServicesStub.notCalled).toBe(true);
  });
});
