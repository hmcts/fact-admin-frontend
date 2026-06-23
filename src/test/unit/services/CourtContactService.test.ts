import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../../../main/requests/DataApiRequests';
import { CourtContactService } from '../../../main/services/CourtContactService';

const courtId = '11111111-1111-4111-8111-111111111111';
const contactTypeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

describe('CourtContactService submitContactDetailFlow', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns validation-error with prebuilt form view model and does not save', async () => {
    const getContactDescriptionTypesSpy = jest
      .spyOn(DataApiRequests.prototype, 'getContactDescriptionTypes')
      .mockResolvedValue([{ id: contactTypeId, name: 'General enquiries' }] as never);
    const createCourtContactDetailSpy = jest
      .spyOn(DataApiRequests.prototype, 'createCourtContactDetail')
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

  test('returns save-error when save status is unsuccessful', async () => {
    const createCourtContactDetailSpy = jest
      .spyOn(DataApiRequests.prototype, 'createCourtContactDetail')
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

  test('returns saved with resolved contact type name when save succeeds', async () => {
    const updateCourtContactDetailSpy = jest
      .spyOn(DataApiRequests.prototype, 'updateCourtContactDetail')
      .mockResolvedValue(HttpStatusCode.Ok);
    const getContactDescriptionTypesSpy = jest
      .spyOn(DataApiRequests.prototype, 'getContactDescriptionTypes')
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
});
