import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { SaveCourtContactDetailRequest } from '../requests/types/SaveCourtContactDetailRequest';
import { CourtContactDetail } from '../schemas/courtContactDetailSchema';
import { CourtEntity } from '../schemas/courtEntitySchema';
import { parseString } from '../utils/valueParsers';

export type CourtContactFormValues = {
  contactEmail: string;
  contactExplanation: string;
  contactMethods: string[];
  contactTelephone: string;
};

export type CourtContactValidationError = {
  href: string;
  text: string;
};

export type CourtContactFormErrors = {
  contactEmail?: string;
  contactExplanation?: string;
  contactMethods?: string;
  contactTelephone?: string;
  contactType?: string;
};

export type CourtContactSubmission = {
  errorSummary: CourtContactValidationError[];
  formErrors: CourtContactFormErrors;
  formValues: CourtContactFormValues;
  payload: SaveCourtContactDetailRequest;
  selectedContactTypeId: string;
};

export type CourtContactDescriptionTypeItem = {
  value: string;
  text: string;
  selected?: boolean;
};

export type CourtContactFormHeading = 'Add contact details' | 'Edit contact details';

export type CourtContactSubmitFlowOptions = {
  body: Record<string, unknown>;
  courtId: string;
  courtName: string;
  formAction: string;
  formHeading: CourtContactFormHeading;
  contactDetailId?: string;
};

export type CourtContactSubmitFlowOutcome =
  | {
      type: 'validation-error';
      formViewModel: CourtContactFormViewModel;
    }
  | {
      type: 'save-error';
      status: HttpStatusCode;
    }
  | {
      type: 'saved';
      successPanelBody: string;
    };

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

type ApiValidationMapping = {
  formField: keyof CourtContactFormErrors;
  href: string;
};

const emailPattern = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const phoneNumberPattern = /^(?:\+44)?[0-9 ]{10,20}$/;
const explanationPattern = /^[A-Za-z0-9 '\-()&+]*$/;
const maxExplanationLength = 250;

const dataApiRequests = new DataApiRequests();

export class CourtContactService {
  public async getCourtById(courtId: string): Promise<CourtEntity | HttpStatusCode> {
    return dataApiRequests.getCourtById(courtId);
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
      dataApiRequests.getCourtContactDetails(courtId),
      dataApiRequests.getContactDescriptionTypes(),
    ]);
    if (typeof courtContactDetailsResponse === 'number') {
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
    const courtContactDetailsResponse = await dataApiRequests.getCourtContactDetails(courtId);
    if (typeof courtContactDetailsResponse === 'number') {
      return courtContactDetailsResponse;
    }

    return courtContactDetailsResponse.find(detail => detail.id === contactDetailId);
  }

  public async getContactDescriptionTypeItems(
    selectedId?: string
  ): Promise<CourtContactDescriptionTypeItem[] | HttpStatusCode> {
    const contactDescriptionTypesResponse = await dataApiRequests.getContactDescriptionTypes();
    if (typeof contactDescriptionTypesResponse === 'number') {
      return contactDescriptionTypesResponse;
    }

    return this.buildContactDescriptionTypeItems(contactDescriptionTypesResponse, selectedId);
  }

  public getEmptyFormValues(): CourtContactFormValues {
    return {
      contactEmail: '',
      contactExplanation: '',
      contactMethods: [],
      contactTelephone: '',
    };
  }

  public buildFormValues(contactDetail: CourtContactDetail): CourtContactFormValues {
    const contactMethods = [contactDetail.email ? 'email' : null, contactDetail.phoneNumber ? 'phone' : null].filter(
      (value): value is string => Boolean(value)
    );

    return {
      contactEmail: contactDetail.email ?? '',
      contactExplanation: contactDetail.explanation ?? '',
      contactMethods,
      contactTelephone: contactDetail.phoneNumber ?? '',
    };
  }

  public buildContactPayload(body: Record<string, unknown>, courtId: string): SaveCourtContactDetailRequest {
    const selectedContactMethods = this.parseSelectedContactMethods(body);
    const includesEmail = selectedContactMethods.includes('email');
    const includesPhone = selectedContactMethods.includes('phone');

    return {
      courtId,
      courtContactDescriptionId: parseString(body['contact-type']),
      explanation: parseString(body['contact-explanation']),
      email: includesEmail ? parseString(body['contact-email']) : undefined,
      phoneNumber: includesPhone ? parseString(body['contact-telephone']) : undefined,
    };
  }

  public validate(body: Record<string, unknown>, courtId: string): CourtContactSubmission {
    const selectedContactMethods = this.parseSelectedContactMethods(body);
    const selectedContactTypeId = parseString(body['contact-type']);
    const contactEmail = parseString(body['contact-email']);
    const contactTelephone = parseString(body['contact-telephone']);
    const payload = this.buildContactPayload(body, courtId);
    const formValues: CourtContactFormValues = {
      contactEmail,
      contactExplanation: parseString(body['contact-explanation']),
      contactMethods: selectedContactMethods,
      contactTelephone,
    };

    const formErrors: CourtContactFormErrors = {};
    const errorSummary: CourtContactValidationError[] = [];

    if (!selectedContactTypeId) {
      formErrors.contactType = 'Select a contact type';
      errorSummary.push({ href: '#contact-type', text: formErrors.contactType });
    }

    if (!selectedContactMethods.length) {
      formErrors.contactMethods = 'Select at least one contact method';
      errorSummary.push({ href: '#contact-methods', text: formErrors.contactMethods });
    }

    if (selectedContactMethods.includes('email')) {
      if (!contactEmail) {
        formErrors.contactEmail = 'Enter an email address';
        errorSummary.push({ href: '#contact-email', text: formErrors.contactEmail });
      } else if (!emailPattern.test(contactEmail)) {
        formErrors.contactEmail = 'Enter an email address in the correct format';
        errorSummary.push({ href: '#contact-email', text: formErrors.contactEmail });
      }
    }

    if (selectedContactMethods.includes('phone')) {
      if (!contactTelephone) {
        formErrors.contactTelephone = 'Enter a phone number';
        errorSummary.push({ href: '#contact-telephone', text: formErrors.contactTelephone });
      } else if (!phoneNumberPattern.test(contactTelephone)) {
        formErrors.contactTelephone = 'Enter a phone number in the correct format';
        errorSummary.push({ href: '#contact-telephone', text: formErrors.contactTelephone });
      }
    }

    const contactExplanation = formValues.contactExplanation;
    if (contactExplanation.length > maxExplanationLength) {
      formErrors.contactExplanation = 'Explanation must be 250 characters or fewer';
      errorSummary.push({ href: '#contact-explanation', text: formErrors.contactExplanation });
    } else if (contactExplanation && !explanationPattern.test(contactExplanation)) {
      formErrors.contactExplanation =
        'Explanation must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs';
      errorSummary.push({ href: '#contact-explanation', text: formErrors.contactExplanation });
    }

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
      return dataApiRequests.updateCourtContactDetail(courtId, contactDetailId, payload);
    }

    return dataApiRequests.createCourtContactDetail(courtId, payload);
  }

  public async submitContactDetailFlow(options: CourtContactSubmitFlowOptions): Promise<CourtContactSubmitFlowOutcome> {
    const submission = this.validate(options.body, options.courtId);

    if (submission.errorSummary.length) {
      const contactDescriptionTypeItems = await this.getContactDescriptionTypeItems(submission.selectedContactTypeId);
      if (typeof contactDescriptionTypeItems === 'number') {
        return {
          status: contactDescriptionTypeItems,
          type: 'save-error',
        };
      }

      return {
        formViewModel: this.buildValidationFormViewModel(options, submission, contactDescriptionTypeItems),
        type: 'validation-error',
      };
    }

    const saveResult = await this.saveContactDetail(options.courtId, submission.payload, options.contactDetailId);
    if (saveResult instanceof Map) {
      const contactDescriptionTypeItems = await this.getContactDescriptionTypeItems(submission.selectedContactTypeId);
      if (typeof contactDescriptionTypeItems === 'number') {
        return {
          status: contactDescriptionTypeItems,
          type: 'save-error',
        };
      }

      const backendErrors = this.mapApiValidationErrors(saveResult);
      return {
        formViewModel: this.buildValidationFormViewModel(
          options,
          {
            ...submission,
            errorSummary: backendErrors.errorSummary,
            formErrors: {
              ...submission.formErrors,
              ...backendErrors.formErrors,
            },
          },
          contactDescriptionTypeItems
        ),
        type: 'validation-error',
      };
    }

    const saveErrorOutcome = this.toSaveErrorOutcome(saveResult);
    if (saveErrorOutcome) {
      return saveErrorOutcome;
    }

    const successPanelBody = await this.resolveContactTypeName(submission.payload.courtContactDescriptionId);
    return {
      successPanelBody,
      type: 'saved',
    };
  }

  public async deleteContactDetail(courtId: string, contactDetailId: string): Promise<HttpStatusCode> {
    return dataApiRequests.deleteCourtContactDetail(courtId, contactDetailId);
  }

  public async resolveContactTypeName(contactDescriptionTypeId: string): Promise<string> {
    const contactDescriptionTypesResponse = await dataApiRequests.getContactDescriptionTypes();
    if (typeof contactDescriptionTypesResponse === 'number') {
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

  private parseSelectedContactMethods(body: Record<string, unknown>): string[] {
    return [body['contact-methods']].flat().filter(Boolean) as string[];
  }

  private buildContactDescriptionTypeItems(
    types: { id: string; name: string }[],
    selectedId?: string
  ): CourtContactDescriptionTypeItem[] {
    return [
      { text: 'Select', value: '' },
      ...types.map(type => ({
        selected: selectedId === type.id,
        text: type.name,
        value: type.id,
      })),
    ];
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

  private toSaveErrorOutcome(
    saveResult: HttpStatusCode | undefined
  ): Extract<CourtContactSubmitFlowOutcome, { type: 'save-error' }> | undefined {
    if (!saveResult) {
      return {
        status: HttpStatusCode.InternalServerError,
        type: 'save-error',
      };
    }

    if (!this.isSuccessfulContactSave(saveResult)) {
      return {
        status: saveResult,
        type: 'save-error',
      };
    }

    return undefined;
  }

  private mapApiValidationErrors(apiErrors: Map<string, string>): {
    errorSummary: CourtContactValidationError[];
    formErrors: CourtContactFormErrors;
  } {
    const formErrors: CourtContactFormErrors = {};
    const errorSummary: CourtContactValidationError[] = [];
    const fieldMappings: Record<string, ApiValidationMapping> = {
      courtContactDescriptionId: { formField: 'contactType', href: '#contact-type' },
      email: { formField: 'contactEmail', href: '#contact-email' },
      phoneNumber: { formField: 'contactTelephone', href: '#contact-telephone' },
      explanation: { formField: 'contactExplanation', href: '#contact-explanation' },
    };

    for (const [field, message] of apiErrors.entries()) {
      const mapping = fieldMappings[field];
      if (!mapping) {
        errorSummary.push({ href: '#main-content', text: '' });
        continue;
      }

      formErrors[mapping.formField] = message;
      errorSummary.push({ href: mapping.href, text: message });
    }

    return { errorSummary, formErrors };
  }
}
