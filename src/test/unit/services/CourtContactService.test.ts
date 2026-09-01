import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../../main/requests/CourtApi';
import { ReferenceDataApi } from '../../../main/requests/ReferenceDataApi';
import { CourtContactService } from '../../../main/services/CourtContactService';

const courtId = '11111111-1111-4111-8111-111111111111';
const contactTypeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('CourtContactService submitContactDetailFlow', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns validation-error with prebuilt form view model and does not save', async () => {
    const getContactDescriptionTypesSpy = jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);
    const createCourtContactDetailSpy = jest
      .spyOn(CourtApi.prototype, 'createCourtContactDetail')
      .mockResolvedValue(HttpStatusCode.Created);

    const result = await new CourtContactService().submitContactDetailFlow({
      body: {
        'contact-methods': [],
        'contact-type': '',
      },
      courtId,
      courtName: 'Reading Crown Court',
      formAction: `/courts/${courtId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
    });

    expect(result).toEqual({
      type: 'validation-error',
      formViewModel: expect.objectContaining({
        courtId,
        courtName: 'Reading Crown Court',
        formHeading: 'Add contact details',
        pageTitle: 'Add contact details - Reading Crown Court',
      }),
    });
    expect(result.type).toBe('validation-error');
    if (result.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(result.formViewModel.formErrors).toMatchObject({
      contactMethods: 'Select at least one contact method',
      contactType: 'Select a contact type',
    });
    expect(result.formViewModel.contactDescriptionTypeItems).toEqual([
      { text: 'Select', value: '' },
      { selected: false, text: 'General enquiries', value: contactTypeId },
    ]);

    expect(getContactDescriptionTypesSpy).toHaveBeenCalledTimes(1);
    expect(createCourtContactDetailSpy).not.toHaveBeenCalled();
  });

  test('returns validation-error when explanation is over 250 characters', async () => {
    const getContactDescriptionTypesSpy = jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);
    const createCourtContactDetailSpy = jest
      .spyOn(CourtApi.prototype, 'createCourtContactDetail')
      .mockResolvedValue(HttpStatusCode.Created);

    const result = await new CourtContactService().submitContactDetailFlow({
      body: {
        'contact-explanation': 'a'.repeat(251),
        'contact-methods': ['email'],
        'contact-email': 'enquiries@example.test',
        'contact-type': contactTypeId,
      },
      courtId,
      courtName: 'Reading Crown Court',
      formAction: `/courts/${courtId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
    });

    expect(result.type).toBe('validation-error');
    if (result.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(result.formViewModel.formErrors.contactExplanation).toBe('Explanation must be 250 characters or fewer');
    expect(result.formViewModel.errorSummary).toContainEqual({
      href: '#contact-explanation',
      text: 'Explanation must be 250 characters or fewer',
    });
    expect(getContactDescriptionTypesSpy).toHaveBeenCalledTimes(1);
    expect(createCourtContactDetailSpy).not.toHaveBeenCalled();
  });

  test('returns validation-error when explanation contains unsupported characters', async () => {
    const getContactDescriptionTypesSpy = jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);
    const createCourtContactDetailSpy = jest
      .spyOn(CourtApi.prototype, 'createCourtContactDetail')
      .mockResolvedValue(HttpStatusCode.Created);

    const result = await new CourtContactService().submitContactDetailFlow({
      body: {
        'contact-explanation': 'Invalid/',
        'contact-methods': ['email'],
        'contact-email': 'enquiries@example.test',
        'contact-type': contactTypeId,
      },
      courtId,
      courtName: 'Reading Crown Court',
      formAction: `/courts/${courtId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
    });

    expect(result.type).toBe('validation-error');
    if (result.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(result.formViewModel.formErrors.contactExplanation).toBe(
      'Explanation must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs'
    );
    expect(result.formViewModel.errorSummary).toContainEqual({
      href: '#contact-explanation',
      text: 'Explanation must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs',
    });
    expect(getContactDescriptionTypesSpy).toHaveBeenCalledTimes(1);
    expect(createCourtContactDetailSpy).not.toHaveBeenCalled();
  });

  test('returns save-error when save status is unsuccessful', async () => {
    const createCourtContactDetailSpy = jest
      .spyOn(CourtApi.prototype, 'createCourtContactDetail')
      .mockResolvedValue(HttpStatusCode.InternalServerError);

    const result = await new CourtContactService().submitContactDetailFlow({
      body: {
        'contact-email': 'enquiries@example.test',
        'contact-methods': ['email'],
        'contact-type': contactTypeId,
      },
      courtId,
      courtName: 'Reading Crown Court',
      formAction: `/courts/${courtId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
    });

    expect(result).toEqual({
      status: HttpStatusCode.InternalServerError,
      type: 'save-error',
    });
    expect(createCourtContactDetailSpy).toHaveBeenCalledWith(courtId, {
      courtContactDescriptionId: contactTypeId,
      courtId,
      email: 'enquiries@example.test',
      explanation: '',
      phoneNumber: undefined,
    });
  });

  test('returns validation-error when backend returns validation map', async () => {
    const createCourtContactDetailSpy = jest
      .spyOn(CourtApi.prototype, 'createCourtContactDetail')
      .mockResolvedValue(new Map([['email', 'Email already exists']]) as never);
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);

    const result = await new CourtContactService().submitContactDetailFlow({
      body: {
        'contact-email': 'enquiries@example.test',
        'contact-methods': ['email'],
        'contact-type': contactTypeId,
      },
      courtId,
      courtName: 'Reading Crown Court',
      formAction: `/courts/${courtId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
    });

    expect(result.type).toBe('validation-error');
    if (result.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(result.formViewModel.formErrors).toMatchObject({
      contactEmail: 'Email already exists',
    });
    expect(result.formViewModel.errorSummary).toEqual([{ href: '#contact-email', text: 'Email already exists' }]);
    expect(createCourtContactDetailSpy).toHaveBeenCalledTimes(1);
  });

  test('returns saved with resolved contact type name when save succeeds', async () => {
    const updateCourtContactDetailSpy = jest
      .spyOn(CourtApi.prototype, 'updateCourtContactDetail')
      .mockResolvedValue(HttpStatusCode.Ok);
    const getContactDescriptionTypesSpy = jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);

    const result = await new CourtContactService().submitContactDetailFlow({
      body: {
        'contact-email': 'enquiries@example.test',
        'contact-methods': ['email'],
        'contact-type': contactTypeId,
      },
      contactDetailId: '99999999-9999-4999-8999-999999999999',
      courtId,
      courtName: 'Reading Crown Court',
      formAction: `/courts/${courtId}/edit/contact-details/edit/99999999-9999-4999-8999-999999999999/success`,
      formHeading: 'Edit contact details',
    });

    expect(result).toEqual({
      successPanelBody: 'General enquiries',
      type: 'saved',
    });
    expect(updateCourtContactDetailSpy).toHaveBeenCalledTimes(1);
    expect(getContactDescriptionTypesSpy).toHaveBeenCalledTimes(1);
  });

  test('maps contact details and falls back to empty descriptions when type lookup fails', async () => {
    jest.spyOn(CourtApi.prototype, 'getCourtContactDetails').mockResolvedValue([
      {
        id: '99999999-9999-4999-8999-999999999999',
        courtContactDescriptionId: contactTypeId,
        explanation: 'General enquiries',
        explanationCy: null,
        email: 'enquiries@example.test',
        phoneNumber: '01234567890',
        courtContactDescription: null,
      },
    ] as never);
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue(HttpStatusCode.InternalServerError);

    const result = await new CourtContactService().listContactDetails(courtId);

    expect(result).toEqual([
      {
        id: '99999999-9999-4999-8999-999999999999',
        courtContactDescriptionId: contactTypeId,
        explanation: 'General enquiries',
        explanationCy: null,
        email: 'enquiries@example.test',
        phoneNumber: '01234567890',
        courtContactDescription: null,
        description: '',
        editHref: `/courts/${courtId}/edit/contact-details/edit/99999999-9999-4999-8999-999999999999`,
        deleteHref: `/courts/${courtId}/edit/contact-details/delete/99999999-9999-4999-8999-999999999999`,
      },
    ]);
  });

  test('returns status when listing contact details fails', async () => {
    jest.spyOn(CourtApi.prototype, 'getCourtContactDetails').mockResolvedValue(HttpStatusCode.InternalServerError);
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);

    const result = await new CourtContactService().listContactDetails(courtId);

    expect(result).toBe(HttpStatusCode.InternalServerError);
  });

  test('maps contact description names when type lookup succeeds', async () => {
    jest.spyOn(CourtApi.prototype, 'getCourtContactDetails').mockResolvedValue([
      {
        id: '99999999-9999-4999-8999-999999999999',
        courtContactDescriptionId: contactTypeId,
        explanation: 'General enquiries',
        explanationCy: null,
        email: 'enquiries@example.test',
        phoneNumber: '01234 567890',
        courtContactDescription: null,
      },
    ] as never);
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);

    const result = await new CourtContactService().listContactDetails(courtId);

    expect(result).toEqual([
      expect.objectContaining({
        description: 'General enquiries',
      }),
    ]);
  });

  test('returns status from getContactDetailById when API returns a status code', async () => {
    jest.spyOn(CourtApi.prototype, 'getCourtContactDetails').mockResolvedValue(HttpStatusCode.InternalServerError);

    await expect(new CourtContactService().getContactDetailById(courtId, 'contact-id')).resolves.toBe(
      HttpStatusCode.InternalServerError
    );
  });

  test('returns status when contact description type lookup fails', async () => {
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue(HttpStatusCode.InternalServerError);

    await expect(new CourtContactService().getContactDescriptionTypeItems()).resolves.toBe(
      HttpStatusCode.InternalServerError
    );
  });

  test('builds empty and populated form values', () => {
    const service = new CourtContactService();

    expect(service.getEmptyFormValues()).toEqual({
      contactEmail: '',
      contactExplanation: '',
      contactExplanationCy: '',
      contactMethods: [],
      contactTelephone: '',
    });

    expect(
      service.buildFormValues({
        id: 'detail-id',
        courtContactDescriptionId: contactTypeId,
        explanation: 'General enquiries',
        explanationCy: 'Ymholiadau cyffredinol',
        email: 'enquiries@example.test',
        phoneNumber: '01234 567890',
        courtContactDescription: null,
      } as never)
    ).toEqual({
      contactEmail: 'enquiries@example.test',
      contactExplanation: 'General enquiries',
      contactExplanationCy: 'Ymholiadau cyffredinol',
      contactMethods: ['email', 'phone'],
      contactTelephone: '01234 567890',
    });
  });

  test('validates email and phone format branches', () => {
    const service = new CourtContactService();

    expect(
      service.validate(
        {
          'contact-email': '',
          'contact-methods': ['email'],
          'contact-type': contactTypeId,
        },
        courtId
      ).formErrors.contactEmail
    ).toBe('Enter an email address');

    expect(
      service.validate(
        {
          'contact-email': 'invalid-email',
          'contact-methods': ['email'],
          'contact-type': contactTypeId,
        },
        courtId
      ).formErrors.contactEmail
    ).toBe('Enter an email address in the correct format');

    expect(
      service.validate(
        {
          'contact-methods': ['phone'],
          'contact-telephone': 'not-a-phone',
          'contact-type': contactTypeId,
        },
        courtId
      ).formErrors.contactTelephone
    ).toBe('Enter a phone number in the correct format');

    expect(
      service.validate(
        {
          'contact-methods': ['phone'],
          'contact-telephone': '',
          'contact-type': contactTypeId,
        },
        courtId
      ).formErrors.contactTelephone
    ).toBe('Enter a phone number');
  });

  test('validates Welsh explanation rules and unsupported characters', () => {
    const service = new CourtContactService();

    const welshOnly = service.validate(
      {
        'contact-explanation-cy': 'Annilys/',
        'contact-methods': ['email'],
        'contact-email': 'enquiries@example.test',
        'contact-type': contactTypeId,
      },
      courtId
    );
    expect(welshOnly.formErrors.contactExplanation).toBe(
      'Because you provided an explanation in Welsh, the English translation is now mandatory'
    );
    expect(welshOnly.formErrors.contactExplanationCy).toBe(
      'Welsh Explanation must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs'
    );

    const welshTooLong = service.validate(
      {
        'contact-explanation': 'General enquiries',
        'contact-explanation-cy': 'a'.repeat(251),
        'contact-methods': ['email'],
        'contact-email': 'enquiries@example.test',
        'contact-type': contactTypeId,
      },
      courtId
    );
    expect(welshTooLong.formErrors.contactExplanationCy).toBe('Welsh translation must be 250 characters or fewer');
  });

  test('returns fallback save-error when save result is undefined', async () => {
    const service = new CourtContactService();
    jest.spyOn(service, 'saveContactDetail').mockResolvedValue(undefined as never);

    const result = await service.submitContactDetailFlow({
      body: {
        'contact-email': 'enquiries@example.test',
        'contact-methods': ['email'],
        'contact-type': contactTypeId,
      },
      courtId,
      courtName: 'Reading Crown Court',
      formAction: `/courts/${courtId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
    });

    expect(result).toEqual({
      status: HttpStatusCode.InternalServerError,
      type: 'save-error',
    });
  });

  test('maps unknown backend fields to main-content summary entry', async () => {
    jest
      .spyOn(CourtApi.prototype, 'createCourtContactDetail')
      .mockResolvedValue(new Map([['unknownField', 'Unknown field error']]) as never);
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);

    const result = await new CourtContactService().submitContactDetailFlow({
      body: {
        'contact-email': 'enquiries@example.test',
        'contact-methods': ['email'],
        'contact-type': contactTypeId,
      },
      courtId,
      courtName: 'Reading Crown Court',
      formAction: `/courts/${courtId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
    });

    expect(result.type).toBe('validation-error');
    if (result.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(result.formViewModel.errorSummary).toContainEqual({ href: '#main-content', text: '' });
  });

  test('delegates delete and resolves contact descriptions via embedded name or type lookup fallback', async () => {
    const deleteSpy = jest
      .spyOn(CourtApi.prototype, 'deleteCourtContactDetail')
      .mockResolvedValue(HttpStatusCode.NoContent);
    const getContactDescriptionTypesSpy = jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValueOnce([{ id: contactTypeId, name: 'General enquiries' }] as never)
      .mockResolvedValueOnce(HttpStatusCode.InternalServerError);
    const service = new CourtContactService();

    await expect(service.deleteContactDetail(courtId, 'detail-id')).resolves.toBe(HttpStatusCode.NoContent);
    await expect(
      service.resolveContactDetailDescription({ courtContactDescription: { name: '  Embedded name  ' } } as never)
    ).resolves.toBe('Embedded name');
    await expect(
      service.resolveContactDetailDescription({
        courtContactDescription: null,
        courtContactDescriptionId: contactTypeId,
      } as never)
    ).resolves.toBe('General enquiries');
    await expect(service.resolveContactTypeName('missing-id')).resolves.toBe('Contact details');

    expect(deleteSpy).toHaveBeenCalledWith(courtId, 'detail-id');
    expect(getContactDescriptionTypesSpy).toHaveBeenCalledTimes(2);
  });
});
