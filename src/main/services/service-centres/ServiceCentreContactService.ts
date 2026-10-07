import { HttpStatusCode } from 'axios';

import { ReferenceDataApi } from '../../requests/ReferenceDataApi';
import { ServiceCentreApi } from '../../requests/ServiceCentreApi';
import { SaveServiceCentreContactDetailRequest } from '../../requests/types/SaveServiceCentreContactDetailRequest';
import { ServiceCentreContactDetail } from '../../schemas/serviceCentreContactDetailSchema';
import { ServiceCentre } from '../../schemas/serviceCentreSchema';
import { isHttpStatusCode } from '../../utils/apiResponses';
import {
  CONTACT_TYPE_REQUIRED_MESSAGE,
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

export type ServiceCentreContactFormValues = ContactFormValues;
export type ServiceCentreContactValidationError = ContactValidationError;
export type ServiceCentreContactFormErrors = ContactFormErrors;
export type ServiceCentreContactDescriptionTypeItem = ContactDescriptionTypeItem;

export type ServiceCentreContactFormHeading = 'Add contact details' | 'Edit contact details';

export type ServiceCentreContactFormViewModel = {
  contactDescriptionTypeItems: ServiceCentreContactDescriptionTypeItem[];
  contactDetailId?: string;
  errorSummary: ServiceCentreContactValidationError[];
  formAction: string;
  formErrors: ServiceCentreContactFormErrors;
  formHeading: ServiceCentreContactFormHeading;
  formValues: ServiceCentreContactFormValues;
  pageTitle: string;
  serviceCentreId: string;
  serviceCentreName: string;
};

type ServiceCentreContactSubmission = {
  errorSummary: ServiceCentreContactValidationError[];
  formErrors: ServiceCentreContactFormErrors;
  formValues: ServiceCentreContactFormValues;
  payload: SaveServiceCentreContactDetailRequest;
  selectedContactTypeId: string;
};

type ServiceCentreContactSubmitFlowOptions = {
  body: Record<string, unknown>;
  contactDetailId?: string;
  formAction: string;
  formHeading: ServiceCentreContactFormHeading;
  serviceCentreId: string;
  serviceCentreName: string;
};

export type ServiceCentreContactSubmitFlowOutcome = ContactSubmitFlowOutcome<ServiceCentreContactFormViewModel>;

export class ServiceCentreContactService {
  public constructor(
    private readonly serviceCentreApi = new ServiceCentreApi(),
    private readonly referenceDataApi = new ReferenceDataApi()
  ) {}

  public async getServiceCentreById(serviceCentreId: string): Promise<ServiceCentre | HttpStatusCode> {
    return this.serviceCentreApi.getServiceCentreById(serviceCentreId);
  }

  public async listContactDetails(serviceCentreId: string): Promise<
    | (ServiceCentreContactDetail & {
        description: string;
        editHref: string;
        deleteHref: string;
      })[]
    | HttpStatusCode
  > {
    const [contactDetailsResponse, contactDescriptionTypesResponse] = await Promise.all([
      this.serviceCentreApi.getServiceCentreContactDetails(serviceCentreId),
      this.referenceDataApi.getContactDescriptionTypes(),
    ]);

    if (isHttpStatusCode(contactDetailsResponse)) {
      return contactDetailsResponse;
    }

    const typeNameById = new Map(
      typeof contactDescriptionTypesResponse === 'number'
        ? []
        : contactDescriptionTypesResponse.map(type => [type.id, type.name] as const)
    );

    return contactDetailsResponse.map(detail => {
      const embeddedDescription = detail.serviceCentreContactDescription?.name?.trim();
      const descriptionId = detail.serviceCentreContactDescription?.id ?? detail.serviceCentreContactDescriptionId;

      return {
        ...detail,
        deleteHref: `/service-centres/${serviceCentreId}/edit/contact-details/delete/${detail.id}`,
        description: embeddedDescription || (descriptionId ? (typeNameById.get(descriptionId) ?? '') : ''),
        editHref: `/service-centres/${serviceCentreId}/edit/contact-details/edit/${detail.id}`,
      };
    });
  }

  public async getContactDetailById(
    serviceCentreId: string,
    contactDetailId: string
  ): Promise<ServiceCentreContactDetail | undefined | HttpStatusCode> {
    const contactDetailsResponse = await this.serviceCentreApi.getServiceCentreContactDetails(serviceCentreId);
    if (isHttpStatusCode(contactDetailsResponse)) {
      return contactDetailsResponse;
    }

    return contactDetailsResponse.find(detail => detail.id === contactDetailId);
  }

  public async getContactDescriptionTypeItems(
    selectedId?: string
  ): Promise<ServiceCentreContactDescriptionTypeItem[] | HttpStatusCode> {
    const contactDescriptionTypesResponse = await this.referenceDataApi.getContactDescriptionTypes();
    if (isHttpStatusCode(contactDescriptionTypesResponse)) {
      return contactDescriptionTypesResponse;
    }

    return buildContactDescriptionTypeItems(contactDescriptionTypesResponse, selectedId);
  }

  public getEmptyFormValues(): ServiceCentreContactFormValues {
    return emptyContactFormValues();
  }

  public buildFormValues(contactDetail: ServiceCentreContactDetail): ServiceCentreContactFormValues {
    return buildContactFormValues(contactDetail);
  }

  public async submitContactDetailFlow(
    options: ServiceCentreContactSubmitFlowOptions
  ): Promise<ServiceCentreContactSubmitFlowOutcome> {
    const submission = this.validate(options.body, options.serviceCentreId);
    return runContactWorkflow<
      ServiceCentreContactSubmission,
      ServiceCentreContactDescriptionTypeItem,
      ServiceCentreContactFormViewModel
    >({
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
      resolveSuccessPanelBody: () => this.resolveContactTypeName(submission.payload.serviceCentreContactDescriptionId),
      save: () => this.saveContactDetail(options.serviceCentreId, submission.payload, options.contactDetailId),
      submission,
    });
  }

  public async deleteContactDetail(serviceCentreId: string, contactDetailId: string): Promise<HttpStatusCode> {
    return this.serviceCentreApi.deleteServiceCentreContactDetail(serviceCentreId, contactDetailId);
  }

  public async resolveContactDetailDescription(contactDetail: ServiceCentreContactDetail): Promise<string> {
    const embeddedDescription = contactDetail.serviceCentreContactDescription?.name?.trim();
    if (embeddedDescription) {
      return embeddedDescription;
    }

    return this.resolveContactTypeName(
      contactDetail.serviceCentreContactDescription?.id ?? contactDetail.serviceCentreContactDescriptionId ?? ''
    );
  }

  private async resolveContactTypeName(contactDescriptionTypeId: string): Promise<string> {
    const contactDescriptionTypesResponse = await this.referenceDataApi.getContactDescriptionTypes();
    if (isHttpStatusCode(contactDescriptionTypesResponse)) {
      return 'Contact details';
    }

    const matchedType = contactDescriptionTypesResponse.find(type => type.id === contactDescriptionTypeId);
    return matchedType?.name ?? 'Contact details';
  }

  private validate(body: Record<string, unknown>, serviceCentreId: string): ServiceCentreContactSubmission {
    const selectedContactMethods = parseSelectedContactMethods(body['contact-methods']);
    const selectedContactTypeId = parseString(body['contact-type']);
    const contactEmail = parseString(body['contact-email']);
    const contactTelephone = parseString(body['contact-telephone']);

    const formValues: ServiceCentreContactFormValues = {
      contactEmail,
      contactExplanation: parseString(body['contact-explanation']),
      contactExplanationCy: parseString(body['contact-explanation-cy']),
      contactMethods: selectedContactMethods,
      contactTelephone,
    };

    const formErrors: ServiceCentreContactFormErrors = {};
    const errorSummary: ServiceCentreContactValidationError[] = [];

    if (!selectedContactTypeId) {
      formErrors.contactType = CONTACT_TYPE_REQUIRED_MESSAGE;
      errorSummary.push({ href: '#contact-type', text: formErrors.contactType });
    }

    validateContactDetailsMethods(selectedContactMethods, contactEmail, contactTelephone, formErrors, errorSummary);

    validateContactExplanationFields(formValues, formErrors, errorSummary, {
      englishInvalidCharacters:
        'Explanation must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs',
      englishPattern: ENGLISH_TEXT_REGEX,
      englishRequired: ENGLISH_TRANSLATION_REQUIRED_MESSAGE,
      englishTooLong: 'Explanation must be 250 characters or fewer',
      maximumLength: MAX_EXPLANATION_LENGTH,
      welshInvalidCharacters:
        'Explanation in Welsh must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs',
      welshPattern: WELSH_TEXT_REGEX,
      welshRequired: WELSH_TRANSLATION_REQUIRED_MESSAGE,
      welshTooLong: 'Explanation in Welsh must be 250 characters or fewer',
    });

    return {
      errorSummary,
      formErrors,
      formValues,
      payload: {
        explanation: formValues.contactExplanation,
        explanationCy: formValues.contactExplanationCy,
        email: selectedContactMethods.includes('email') ? contactEmail : undefined,
        phoneNumber: selectedContactMethods.includes('phone') ? contactTelephone : undefined,
        serviceCentreContactDescriptionId: selectedContactTypeId,
        serviceCentreId,
      },
      selectedContactTypeId,
    };
  }

  private async saveContactDetail(
    serviceCentreId: string,
    payload: SaveServiceCentreContactDetailRequest,
    contactDetailId?: string
  ): Promise<HttpStatusCode | Map<string, string>> {
    if (contactDetailId) {
      return this.serviceCentreApi.updateServiceCentreContactDetail(serviceCentreId, contactDetailId, payload);
    }

    return this.serviceCentreApi.createServiceCentreContactDetail(serviceCentreId, payload);
  }

  private buildValidationFormViewModel(
    options: ServiceCentreContactSubmitFlowOptions,
    submission: ServiceCentreContactSubmission,
    contactDescriptionTypeItems: ServiceCentreContactDescriptionTypeItem[]
  ): ServiceCentreContactFormViewModel {
    return {
      contactDescriptionTypeItems,
      contactDetailId: options.contactDetailId,
      errorSummary: submission.errorSummary,
      formAction: options.formAction,
      formErrors: submission.formErrors,
      formHeading: options.formHeading,
      formValues: submission.formValues,
      pageTitle: `${options.formHeading} - ${options.serviceCentreName}`,
      serviceCentreId: options.serviceCentreId,
      serviceCentreName: options.serviceCentreName,
    };
  }

  private mapApiValidationErrors(apiErrors: Map<string, string>): {
    errorSummary: ServiceCentreContactValidationError[];
    formErrors: ServiceCentreContactFormErrors;
  } {
    const fieldMappings: Record<string, ContactApiFieldMapping<ServiceCentreContactFormErrors>> = {
      serviceCentreContactDescriptionId: { formField: 'contactType', href: '#contact-type' },
      courtContactDescriptionId: { formField: 'contactType', href: '#contact-type' },
      email: { formField: 'contactEmail', href: '#contact-email' },
      explanation: { formField: 'contactExplanation', href: '#contact-explanation' },
      explanationCy: { formField: 'contactExplanationCy', href: '#contact-explanation-cy' },
      phoneNumber: { formField: 'contactTelephone', href: '#contact-telephone' },
    };

    return mapContactApiValidationErrors(apiErrors, fieldMappings, { ignoredKeys: ['timestamp'] });
  }
}
