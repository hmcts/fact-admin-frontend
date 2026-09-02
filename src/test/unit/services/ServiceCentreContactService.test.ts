import { HttpStatusCode } from 'axios';

import { ReferenceDataApi } from '../../../main/requests/ReferenceDataApi';
import { ServiceCentreApi } from '../../../main/requests/ServiceCentreApi';
import { ServiceCentreContactService } from '../../../main/services/ServiceCentreContactService';

describe('ServiceCentreContactService', () => {
  const serviceCentreId = '11111111-1111-4111-8111-111111111111';
  const contactTypeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('lists contact details with mapped descriptions and edit/delete links', async () => {
    jest.spyOn(ServiceCentreApi.prototype, 'getServiceCentreContactDetails').mockResolvedValue([
      {
        id: '22222222-2222-4222-8222-222222222222',
        serviceCentreId,
        serviceCentreContactDescription: null,
        serviceCentreContactDescriptionId: contactTypeId,
        email: 'enquiries@example.test',
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        serviceCentreId,
        serviceCentreContactDescription: { id: 'other', name: '  Embedded name  ' },
        email: null,
      },
    ] as never);
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);

    const service = new ServiceCentreContactService();
    const result = await service.listContactDetails(serviceCentreId);

    expect(result).toEqual([
      expect.objectContaining({
        deleteHref: `/service-centres/${serviceCentreId}/edit/contact-details/delete/22222222-2222-4222-8222-222222222222`,
        description: 'General enquiries',
        editHref: `/service-centres/${serviceCentreId}/edit/contact-details/edit/22222222-2222-4222-8222-222222222222`,
      }),
      expect.objectContaining({
        deleteHref: `/service-centres/${serviceCentreId}/edit/contact-details/delete/33333333-3333-4333-8333-333333333333`,
        description: 'Embedded name',
        editHref: `/service-centres/${serviceCentreId}/edit/contact-details/edit/33333333-3333-4333-8333-333333333333`,
      }),
    ]);
  });

  test('listContactDetails returns status when contact details request fails', async () => {
    jest.spyOn(ServiceCentreApi.prototype, 'getServiceCentreContactDetails').mockResolvedValue(HttpStatusCode.NotFound);
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new ServiceCentreContactService();
    const result = await service.listContactDetails(serviceCentreId);

    expect(result).toBe(HttpStatusCode.NotFound);
  });

  test('listContactDetails falls back to empty description when type lookup fails for an existing description id', async () => {
    jest.spyOn(ServiceCentreApi.prototype, 'getServiceCentreContactDetails').mockResolvedValue([
      {
        id: '22222222-2222-4222-8222-222222222222',
        serviceCentreId,
        serviceCentreContactDescription: null,
        serviceCentreContactDescriptionId: contactTypeId,
        email: 'enquiries@example.test',
      },
    ] as never);
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue(HttpStatusCode.InternalServerError);

    const result = await new ServiceCentreContactService().listContactDetails(serviceCentreId);

    expect(result).toEqual([expect.objectContaining({ description: '' })]);
  });

  test('getContactDetailById returns status, undefined, or matched detail', async () => {
    const getServiceCentreContactDetails = jest
      .spyOn(ServiceCentreApi.prototype, 'getServiceCentreContactDetails')
      .mockResolvedValueOnce(HttpStatusCode.BadGateway)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([
        {
          id: '22222222-2222-4222-8222-222222222222',
          serviceCentreId,
          serviceCentreContactDescription: null,
          email: null,
        },
      ] as never);

    const service = new ServiceCentreContactService();

    await expect(service.getContactDetailById(serviceCentreId, 'any')).resolves.toBe(HttpStatusCode.BadGateway);
    await expect(service.getContactDetailById(serviceCentreId, 'missing')).resolves.toBeUndefined();
    await expect(
      service.getContactDetailById(serviceCentreId, '22222222-2222-4222-8222-222222222222')
    ).resolves.toEqual(expect.objectContaining({ id: '22222222-2222-4222-8222-222222222222' }));

    expect(getServiceCentreContactDetails).toHaveBeenCalledTimes(3);
  });

  test('getContactDescriptionTypeItems returns status or selected options', async () => {
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValueOnce(HttpStatusCode.InternalServerError)
      .mockResolvedValueOnce([
        { id: contactTypeId, name: 'General enquiries' },
        { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', name: 'Payments' },
      ] as never);

    const service = new ServiceCentreContactService();

    await expect(service.getContactDescriptionTypeItems()).resolves.toBe(HttpStatusCode.InternalServerError);
    await expect(service.getContactDescriptionTypeItems(contactTypeId)).resolves.toEqual([
      { text: 'Select', value: '' },
      { selected: true, text: 'General enquiries', value: contactTypeId },
      { selected: false, text: 'Payments', value: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' },
    ]);
  });

  test('returns empty and populated form values', () => {
    const service = new ServiceCentreContactService();

    expect(service.getEmptyFormValues()).toEqual({
      contactEmail: '',
      contactExplanation: '',
      contactExplanationCy: '',
      contactMethods: [],
      contactTelephone: '',
    });

    expect(
      service.buildFormValues({
        id: '22222222-2222-4222-8222-222222222222',
        serviceCentreId,
        email: 'enquiries@example.test',
        explanation: 'Ring us first',
        explanationCy: 'Ffoniwch ni gyntaf',
        phoneNumber: '020 7946 0018',
        serviceCentreContactDescription: null,
      })
    ).toEqual({
      contactEmail: 'enquiries@example.test',
      contactExplanation: 'Ring us first',
      contactExplanationCy: 'Ffoniwch ni gyntaf',
      contactMethods: ['email', 'phone'],
      contactTelephone: '020 7946 0018',
    });
  });

  test('submitContactDetailFlow returns validation-error when body is invalid', async () => {
    const createServiceCentreContactDetail = jest.spyOn(ServiceCentreApi.prototype, 'createServiceCentreContactDetail');
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);

    const service = new ServiceCentreContactService();
    const result = await service.submitContactDetailFlow({
      body: {
        'contact-methods': [],
        'contact-type': '',
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(result.type).toBe('validation-error');
    if (result.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(result.formViewModel.formErrors).toMatchObject({
      contactMethods: 'Select at least one contact method',
      contactType: 'Select a contact type',
    });
    expect(createServiceCentreContactDetail).not.toHaveBeenCalled();
  });

  test('submitContactDetailFlow validates missing and malformed email values', async () => {
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);
    const service = new ServiceCentreContactService();

    const missingEmail = await service.submitContactDetailFlow({
      body: {
        'contact-email': '',
        'contact-methods': ['email'],
        'contact-type': contactTypeId,
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    const malformedEmail = await service.submitContactDetailFlow({
      body: {
        'contact-email': 'invalid-email',
        'contact-methods': ['email'],
        'contact-type': contactTypeId,
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(missingEmail.type).toBe('validation-error');
    expect(malformedEmail.type).toBe('validation-error');
    if (missingEmail.type !== 'validation-error' || malformedEmail.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(missingEmail.formViewModel.formErrors.contactEmail).toBe('Enter an email address');
    expect(malformedEmail.formViewModel.formErrors.contactEmail).toBe('Enter an email address in the correct format');
  });

  test('submitContactDetailFlow validates explanation format, length and translation dependencies', async () => {
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);
    const service = new ServiceCentreContactService();

    const englishInvalid = await service.submitContactDetailFlow({
      body: {
        'contact-explanation': 'Invalid/',
        'contact-methods': ['email'],
        'contact-email': 'enquiries@example.test',
        'contact-type': contactTypeId,
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    const englishMissingWelsh = await service.submitContactDetailFlow({
      body: {
        'contact-explanation': 'General enquiries',
        'contact-explanation-cy': '',
        'contact-methods': ['email'],
        'contact-email': 'enquiries@example.test',
        'contact-type': contactTypeId,
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    const welshInvalid = await service.submitContactDetailFlow({
      body: {
        'contact-explanation': '',
        'contact-explanation-cy': 'Annilys/',
        'contact-methods': ['email'],
        'contact-email': 'enquiries@example.test',
        'contact-type': contactTypeId,
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    const welshTooLong = await service.submitContactDetailFlow({
      body: {
        'contact-explanation': 'General enquiries',
        'contact-explanation-cy': 'a'.repeat(251),
        'contact-methods': ['email'],
        'contact-email': 'enquiries@example.test',
        'contact-type': contactTypeId,
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(englishInvalid.type).toBe('validation-error');
    expect(englishMissingWelsh.type).toBe('validation-error');
    expect(welshInvalid.type).toBe('validation-error');
    expect(welshTooLong.type).toBe('validation-error');
    if (
      englishInvalid.type !== 'validation-error' ||
      englishMissingWelsh.type !== 'validation-error' ||
      welshInvalid.type !== 'validation-error' ||
      welshTooLong.type !== 'validation-error'
    ) {
      throw new Error('Expected validation-error outcome');
    }

    expect(englishInvalid.formViewModel.formErrors.contactExplanation).toBe(
      'Explanation must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs'
    );
    expect(englishMissingWelsh.formViewModel.formErrors.contactExplanationCy).toBe(
      'Because you provided an explanation in English, the Welsh translation is now mandatory'
    );
    expect(welshInvalid.formViewModel.formErrors.contactExplanation).toBe(
      'Because you provided an explanation in Welsh, the English translation is now mandatory'
    );
    expect(welshInvalid.formViewModel.formErrors.contactExplanationCy).toBe(
      'Explanation in Welsh must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs'
    );
    expect(welshTooLong.formViewModel.formErrors.contactExplanationCy).toBe(
      'Explanation in Welsh must be 250 characters or fewer'
    );
  });

  test('submitContactDetailFlow returns save-error when type lookup fails during validation', async () => {
    jest.spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes').mockResolvedValue(HttpStatusCode.BadGateway);

    const service = new ServiceCentreContactService();
    const result = await service.submitContactDetailFlow({
      body: {
        'contact-methods': [],
        'contact-type': '',
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(result).toEqual({ status: HttpStatusCode.BadGateway, type: 'save-error' });
  });

  test('submitContactDetailFlow returns save-error when save status is unsuccessful', async () => {
    const createServiceCentreContactDetail = jest
      .spyOn(ServiceCentreApi.prototype, 'createServiceCentreContactDetail')
      .mockResolvedValue(HttpStatusCode.InternalServerError);

    const service = new ServiceCentreContactService();
    const result = await service.submitContactDetailFlow({
      body: {
        'contact-email': 'enquiries@example.test',
        'contact-methods': ['email'],
        'contact-type': contactTypeId,
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(result).toEqual({ status: HttpStatusCode.InternalServerError, type: 'save-error' });
    expect(createServiceCentreContactDetail).toHaveBeenCalledWith(serviceCentreId, {
      email: 'enquiries@example.test',
      explanation: '',
      explanationCy: '',
      phoneNumber: undefined,
      serviceCentreContactDescriptionId: contactTypeId,
      serviceCentreId,
    });
  });

  test('submitContactDetailFlow returns internal-server-error when save result is undefined', async () => {
    const service = new ServiceCentreContactService() as unknown as {
      submitContactDetailFlow: ServiceCentreContactService['submitContactDetailFlow'];
      saveContactDetail: (
        serviceCentreId: string,
        payload: Record<string, unknown>,
        contactDetailId?: string
      ) => Promise<HttpStatusCode | Map<string, string> | undefined>;
    };
    jest.spyOn(service, 'saveContactDetail').mockResolvedValue(undefined);

    const result = await service.submitContactDetailFlow({
      body: {
        'contact-email': 'enquiries@example.test',
        'contact-methods': ['email'],
        'contact-type': contactTypeId,
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(result).toEqual({ status: HttpStatusCode.InternalServerError, type: 'save-error' });
  });

  test('submitContactDetailFlow maps backend validation map into form errors', async () => {
    jest.spyOn(ServiceCentreApi.prototype, 'createServiceCentreContactDetail').mockResolvedValue(
      new Map([
        ['email', 'Email already exists'],
        ['unknownField', 'Unexpected error'],
      ]) as never
    );
    jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);

    const service = new ServiceCentreContactService();
    const result = await service.submitContactDetailFlow({
      body: {
        'contact-email': 'enquiries@example.test',
        'contact-methods': ['email'],
        'contact-type': contactTypeId,
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(result.type).toBe('validation-error');
    if (result.type !== 'validation-error') {
      throw new Error('Expected validation-error outcome');
    }

    expect(result.formViewModel.formErrors.contactEmail).toBe('Email already exists');
    expect(result.formViewModel.errorSummary).toContainEqual({ href: '#main-content', text: 'Unexpected error' });
  });

  test('submitContactDetailFlow returns save-error when type lookup fails after backend validation map', async () => {
    jest
      .spyOn(ServiceCentreApi.prototype, 'createServiceCentreContactDetail')
      .mockResolvedValue(new Map([['email', 'Email already exists']]) as never);
    jest.spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes').mockResolvedValue(HttpStatusCode.BadGateway);

    const service = new ServiceCentreContactService();
    const result = await service.submitContactDetailFlow({
      body: {
        'contact-email': 'enquiries@example.test',
        'contact-methods': ['email'],
        'contact-type': contactTypeId,
      },
      formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
      formHeading: 'Add contact details',
      serviceCentreId,
      serviceCentreName: 'Reading Service Centre',
    });

    expect(result).toEqual({ status: HttpStatusCode.BadGateway, type: 'save-error' });
  });

  test('submitContactDetailFlow returns saved when create and update succeed', async () => {
    const createServiceCentreContactDetail = jest
      .spyOn(ServiceCentreApi.prototype, 'createServiceCentreContactDetail')
      .mockResolvedValue(HttpStatusCode.Created);
    const updateServiceCentreContactDetail = jest
      .spyOn(ServiceCentreApi.prototype, 'updateServiceCentreContactDetail')
      .mockResolvedValue(HttpStatusCode.Ok);
    const getContactDescriptionTypes = jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValueOnce([{ id: contactTypeId, name: 'General enquiries' }] as never)
      .mockResolvedValueOnce(HttpStatusCode.InternalServerError);

    const service = new ServiceCentreContactService();

    await expect(
      service.submitContactDetailFlow({
        body: {
          'contact-email': 'enquiries@example.test',
          'contact-methods': ['email'],
          'contact-type': contactTypeId,
        },
        formAction: `/service-centres/${serviceCentreId}/edit/contact-details/add/success`,
        formHeading: 'Add contact details',
        serviceCentreId,
        serviceCentreName: 'Reading Service Centre',
      })
    ).resolves.toEqual({ successPanelBody: 'General enquiries', type: 'saved' });

    await expect(
      service.submitContactDetailFlow({
        body: {
          'contact-methods': ['phone'],
          'contact-telephone': '020 7946 0018',
          'contact-type': contactTypeId,
        },
        contactDetailId: '44444444-4444-4444-8444-444444444444',
        formAction: `/service-centres/${serviceCentreId}/edit/contact-details/edit/44444444-4444-4444-8444-444444444444/success`,
        formHeading: 'Edit contact details',
        serviceCentreId,
        serviceCentreName: 'Reading Service Centre',
      })
    ).resolves.toEqual({ successPanelBody: 'Contact details', type: 'saved' });

    expect(createServiceCentreContactDetail).toHaveBeenCalledTimes(1);
    expect(updateServiceCentreContactDetail).toHaveBeenCalledTimes(1);
    expect(getContactDescriptionTypes).toHaveBeenCalledTimes(2);
  });

  test('deleteContactDetail delegates to request layer', async () => {
    const deleteServiceCentreContactDetail = jest
      .spyOn(ServiceCentreApi.prototype, 'deleteServiceCentreContactDetail')
      .mockResolvedValue(HttpStatusCode.NoContent);

    const service = new ServiceCentreContactService();
    const result = await service.deleteContactDetail(serviceCentreId, '22222222-2222-4222-8222-222222222222');

    expect(result).toBe(HttpStatusCode.NoContent);
    expect(deleteServiceCentreContactDetail).toHaveBeenCalledWith(
      serviceCentreId,
      '22222222-2222-4222-8222-222222222222'
    );
  });

  test('resolveContactDetailDescription prefers embedded text and falls back to type lookup', async () => {
    const getContactDescriptionTypes = jest
      .spyOn(ReferenceDataApi.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);

    const service = new ServiceCentreContactService();

    await expect(
      service.resolveContactDetailDescription({
        id: '22222222-2222-4222-8222-222222222222',
        serviceCentreId,
        serviceCentreContactDescription: { id: contactTypeId, name: '  Embedded description  ' },
      })
    ).resolves.toBe('Embedded description');

    await expect(
      service.resolveContactDetailDescription({
        id: '33333333-3333-4333-8333-333333333333',
        serviceCentreId,
        serviceCentreContactDescription: null,
        serviceCentreContactDescriptionId: contactTypeId,
      })
    ).resolves.toBe('General enquiries');

    expect(getContactDescriptionTypes).toHaveBeenCalledTimes(1);
  });

  test('getServiceCentreById delegates directly', async () => {
    const getServiceCentreById = jest.spyOn(ServiceCentreApi.prototype, 'getServiceCentreById').mockResolvedValue({
      id: serviceCentreId,
      name: 'Reading Service Centre',
      open: false,
      slug: 'reading-service-centre',
    } as never);

    const service = new ServiceCentreContactService();
    const result = await service.getServiceCentreById(serviceCentreId);

    expect(result).toEqual(expect.objectContaining({ id: serviceCentreId, name: 'Reading Service Centre' }));
    expect(getServiceCentreById).toHaveBeenCalledWith(serviceCentreId);
  });
});
