import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { ReferenceDataApi } from '../../requests/ReferenceDataApi';
import { SaveCourtContactDetailRequest } from '../../requests/types/SaveCourtContactDetailRequest';
import { CourtContactDetail } from '../../schemas/courtContactDetailSchema';
import { CourtEntity } from '../../schemas/courtEntitySchema';
import { isHttpStatusCode } from '../../utils/apiResponses';
import {
  CONTACT_TYPE_REQUIRED_MESSAGE,
  COURT_CONTACT_EXPLANATION_INVALID_CHARACTERS_MESSAGE,
  COURT_CONTACT_EXPLANATION_MAX_LENGTH_MESSAGE,
  COURT_CONTACT_WELSH_EXPLANATION_INVALID_CHARACTERS_MESSAGE,
  COURT_CONTACT_WELSH_TRANSLATION_MAX_LENGTH_MESSAGE,
  ENGLISH_TRANSLATION_REQUIRED_MESSAGE,
  MAX_EXPLANATION_LENGTH,
  WELSH_TRANSLATION_REQUIRED_MESSAGE,
} from '../../utils/constants/messageConstants';
import { ENGLISH_TEXT_REGEX, WELSH_TEXT_REGEX } from '../../utils/constants/regexConstants';
import {
  ContactApiFieldMapping,
  ContactDescriptionTypeItem,
  ContactFormErrors,
  ContactFormValues,
  ContactValidationError,
  buildContactDescriptionTypeItems,
  buildContactFormValues,
  emptyContactFormValues,
  mapContactApiValidationErrors,
  parseSelectedContactMethods,
  validateContactDetailsMethods,
  validateContactExplanationFields,
} from '../../utils/contactDetailsValidation';
import { parseString } from '../../utils/valueParsers';
import { ContactSubmitFlowOutcome, runContactWorkflow } from '../shared/ContactWorkflow';

export type CourtContactFormValues = ContactFormValues;
export type CourtContactValidationError = ContactValidationError;
export type CourtContactFormErrors = ContactFormErrors;

export type CourtContactSubmission = {
  errorSummary: CourtContactValidationError[];
  formErrors: CourtContactFormErrors;
  formValues: CourtContactFormValues;
  payload: SaveCourtContactDetailRequest;
  selectedContactTypeId: string;
};

export type CourtContactDescriptionTypeItem = ContactDescriptionTypeItem;

export type CourtContactFormHeading = 'Add contact details' | 'Edit contact details';

export type CourtContactSubmitFlowOptions = {
  body: Record<string, unknown>;
  courtId: string;
  courtName: string;
  formAction: string;
  formHeading: CourtContactFormHeading;
  contactDetailId?: string;
};

export type CourtContactSubmitFlowOutcome = ContactSubmitFlowOutcome<CourtContactFormViewModel>;

export type CourtContactFormViewModel = {
  courtId: string;
  courtName: string;
  contactDescriptionTypeItems: CourtContactDescriptionTypeItem[];
  contactDetailId?: string;
  errorSummary: CourtContactValidationError[];
  formAction: string;
  formErrors: CourtContactFormErrors;
  formHeading: CourtContactFormHeading;
  formValues: CourtContactFormValues;
  pageTitle: string;
};

const courtApi = new CourtApi();
const referenceDataApi = new ReferenceDataApi();

export class CourtContactService {
  public async getCourtById(courtId: string): Promise<CourtEntity | HttpStatusCode> {
    return courtApi.getCourtById(courtId);
  }

  public async listContactDetails(courtId: string): Promise<
    | (CourtContactDetail & {
        description: string;
        editHref: string;
        deleteHref: string;
      })[]
    | HttpStatusCode
  > {
    const [courtContactDetailsResponse, contactDescriptionTypesResponse] = await Promise.all([
      courtApi.getCourtContactDetails(courtId),
      referenceDataApi.getContactDescriptionTypes(),
    ]);
    if (isHttpStatusCode(courtContactDetailsResponse)) {
      return courtContactDetailsResponse;
    }

    const typeNameById = new Map(
      typeof contactDescriptionTypesResponse === 'number'
        ? []
        : contactDescriptionTypesResponse.map(type => [type.id, type.name] as const)
    );

    return courtContactDetailsResponse.map(detail => ({
      ...detail,
      description: typeNameById.get(detail.courtContactDescriptionId) ?? '',
      editHref: `/courts/${courtId}/edit/contact-details/edit/${detail.id}`,
      deleteHref: `/courts/${courtId}/edit/contact-details/delete/${detail.id}`,
    }));
  }

  public async getContactDetailById(
    courtId: string,
    contactDetailId: string
  ): Promise<CourtContactDetail | undefined | number> {
    const courtContactDetailsResponse = await courtApi.getCourtContactDetails(courtId);
    if (isHttpStatusCode(courtContactDetailsResponse)) {
      return courtContactDetailsResponse;
    }

    return courtContactDetailsResponse.find(detail => detail.id === contactDetailId);
  }

  public async getContactDescriptionTypeItems(
    selectedId?: string
  ): Promise<CourtContactDescriptionTypeItem[] | HttpStatusCode> {
    const contactDescriptionTypesResponse = await referenceDataApi.getContactDescriptionTypes();
    if (isHttpStatusCode(contactDescriptionTypesResponse)) {
      return contactDescriptionTypesResponse;
    }

    return buildContactDescriptionTypeItems(contactDescriptionTypesResponse, selectedId);
  }

  public getEmptyFormValues(): CourtContactFormValues {
    return emptyContactFormValues();
  }

  public buildFormValues(contactDetail: CourtContactDetail): CourtContactFormValues {
    return buildContactFormValues(contactDetail);
  }

  public buildContactPayload(body: Record<string, unknown>, courtId: string): SaveCourtContactDetailRequest {
    const selectedContactMethods = parseSelectedContactMethods(body['contact-methods']);
    const includesEmail = selectedContactMethods.includes('email');
    const includesPhone = selectedContactMethods.includes('phone');

    return {
      courtId,
      courtContactDescriptionId: parseString(body['contact-type']),
      explanation: parseString(body['contact-explanation']),
      explanationCy: parseString(body['contact-explanation']) ? parseString(body['contact-explanation-cy']) : undefined,
      email: includesEmail ? parseString(body['contact-email']) : undefined,
      phoneNumber: includesPhone ? parseString(body['contact-telephone']) : undefined,
    };
  }

  public validate(body: Record<string, unknown>, courtId: string): CourtContactSubmission {
    const selectedContactMethods = parseSelectedContactMethods(body['contact-methods']);
    const selectedContactTypeId = parseString(body['contact-type']);
    const contactEmail = parseString(body['contact-email']);
    const contactTelephone = parseString(body['contact-telephone']);
    const payload = this.buildContactPayload(body, courtId);
    const formValues: CourtContactFormValues = {
      contactEmail,
      contactExplanation: parseString(body['contact-explanation']),
      contactExplanationCy: parseString(body['contact-explanation-cy']),
      contactMethods: selectedContactMethods,
      contactTelephone,
    };

    const formErrors: CourtContactFormErrors = {};
    const errorSummary: CourtContactValidationError[] = [];

    if (!selectedContactTypeId) {
      formErrors.contactType = CONTACT_TYPE_REQUIRED_MESSAGE;
      errorSummary.push({ href: '#contact-type', text: formErrors.contactType });
    }

    validateContactDetailsMethods(selectedContactMethods, contactEmail, contactTelephone, formErrors, errorSummary);

    validateContactExplanationFields(formValues, formErrors, errorSummary, {
      englishInvalidCharacters: COURT_CONTACT_EXPLANATION_INVALID_CHARACTERS_MESSAGE,
      englishPattern: ENGLISH_TEXT_REGEX,
      englishRequired: ENGLISH_TRANSLATION_REQUIRED_MESSAGE,
      englishTooLong: COURT_CONTACT_EXPLANATION_MAX_LENGTH_MESSAGE,
      maximumLength: MAX_EXPLANATION_LENGTH,
      welshInvalidCharacters: COURT_CONTACT_WELSH_EXPLANATION_INVALID_CHARACTERS_MESSAGE,
      welshPattern: WELSH_TEXT_REGEX,
      welshRequired: WELSH_TRANSLATION_REQUIRED_MESSAGE,
      welshTooLong: COURT_CONTACT_WELSH_TRANSLATION_MAX_LENGTH_MESSAGE,
    });

    return {
      errorSummary,
      formErrors,
      formValues,
      payload,
      selectedContactTypeId,
    };
  }

  public async saveContactDetail(
    courtId: string,
    payload: SaveCourtContactDetailRequest,
    contactDetailId?: string
  ): Promise<HttpStatusCode | Map<string, string>> {
    if (contactDetailId) {
      return courtApi.updateCourtContactDetail(courtId, contactDetailId, payload);
    }

    return courtApi.createCourtContactDetail(courtId, payload);
  }

  public async submitContactDetailFlow(options: CourtContactSubmitFlowOptions): Promise<CourtContactSubmitFlowOutcome> {
    const submission = this.validate(options.body, options.courtId);
    return runContactWorkflow<CourtContactSubmission, CourtContactDescriptionTypeItem, CourtContactFormViewModel>({
      buildValidationViewModel: (currentSubmission, items) =>
        this.buildValidationFormViewModel(options, currentSubmission, items),
      getContactDescriptionTypeItems: selectedId => this.getContactDescriptionTypeItems(selectedId),
      mergeApiErrors: (currentSubmission, apiErrors) => {
        const backendErrors = this.mapApiValidationErrors(apiErrors);
        return {
          ...currentSubmission,
          errorSummary: backendErrors.errorSummary,
          formErrors: { ...currentSubmission.formErrors, ...backendErrors.formErrors },
        };
      },
      resolveSuccessPanelBody: () => this.resolveContactTypeName(submission.payload.courtContactDescriptionId),
      save: () => this.saveContactDetail(options.courtId, submission.payload, options.contactDetailId),
      submission,
    });
  }

  public async deleteContactDetail(courtId: string, contactDetailId: string): Promise<HttpStatusCode> {
    return courtApi.deleteCourtContactDetail(courtId, contactDetailId);
  }

  public async resolveContactTypeName(contactDescriptionTypeId: string): Promise<string> {
    const contactDescriptionTypesResponse = await referenceDataApi.getContactDescriptionTypes();
    if (isHttpStatusCode(contactDescriptionTypesResponse)) {
      return 'Contact details';
    }

    const matchedType = contactDescriptionTypesResponse.find(type => type.id === contactDescriptionTypeId);
    return matchedType?.name ?? 'Contact details';
  }

  public async resolveContactDetailDescription(contactDetail: CourtContactDetail): Promise<string> {
    const embeddedDescription = contactDetail.courtContactDescription?.name?.trim();
    if (embeddedDescription) {
      return embeddedDescription;
    }

    return this.resolveContactTypeName(contactDetail.courtContactDescriptionId);
  }

  public isSuccessfulContactSave(status: HttpStatusCode): boolean {
    return [HttpStatusCode.Ok, HttpStatusCode.Created, HttpStatusCode.NoContent].includes(status);
  }

  private buildValidationFormViewModel(
    options: CourtContactSubmitFlowOptions,
    submission: CourtContactSubmission,
    contactDescriptionTypeItems: CourtContactDescriptionTypeItem[]
  ): CourtContactFormViewModel {
    return {
      contactDescriptionTypeItems,
      contactDetailId: options.contactDetailId,
      courtId: options.courtId,
      courtName: options.courtName,
      errorSummary: submission.errorSummary,
      formAction: options.formAction,
      formErrors: submission.formErrors,
      formHeading: options.formHeading,
      formValues: submission.formValues,
      pageTitle: `${options.formHeading} - ${options.courtName}`,
    };
  }

  private mapApiValidationErrors(apiErrors: Map<string, string>): {
    errorSummary: CourtContactValidationError[];
    formErrors: CourtContactFormErrors;
  } {
    const fieldMappings: Record<string, ContactApiFieldMapping<CourtContactFormErrors>> = {
      courtContactDescriptionId: { formField: 'contactType', href: '#contact-type' },
      email: { formField: 'contactEmail', href: '#contact-email' },
      phoneNumber: { formField: 'contactTelephone', href: '#contact-telephone' },
      explanation: { formField: 'contactExplanation', href: '#contact-explanation' },
      explanationCy: { formField: 'contactExplanationCy', href: '#contact-explanation-cy' },
    };

    return mapContactApiValidationErrors(apiErrors, fieldMappings, { unknownErrorText: () => '' });
  }
}
