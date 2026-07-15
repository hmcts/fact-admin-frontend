import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { SaveServiceCentreContactDetailRequest } from '../requests/types/SaveServiceCentreContactDetailRequest';
import { ServiceCentreContactDetail } from '../schemas/serviceCentreContactDetailSchema';
import { ServiceCentre } from '../schemas/serviceCentreSchema';
import { parseString } from '../utils/valueParsers';

export type ServiceCentreContactFormValues = {
  contactEmail: string;
  contactExplanation: string;
  contactExplanationCy: string;
  contactMethods: string[];
  contactTelephone: string;
};

export type ServiceCentreContactValidationError = {
  href: string;
  text: string;
};

export type ServiceCentreContactFormErrors = {
  contactEmail?: string;
  contactExplanation?: string;
  contactExplanationCy?: string;
  contactMethods?: string;
  contactTelephone?: string;
  contactType?: string;
};

export type ServiceCentreContactDescriptionTypeItem = {
  value: string;
  text: string;
  selected?: boolean;
};

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

export type ServiceCentreContactSubmitFlowOutcome =
  | {
      type: 'validation-error';
      formViewModel: ServiceCentreContactFormViewModel;
    }
  | {
      type: 'save-error';
      status: HttpStatusCode;
    }
  | {
      type: 'saved';
      successPanelBody: string;
    };

const emailPattern = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const phoneNumberPattern = /^(?:\+44)?[0-9 ]{10,20}$/;
const explanationPattern = /^[A-Za-z0-9 '\-()&+]*$/;
const maxExplanationLength = 250;

export class ServiceCentreContactService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async getServiceCentreById(serviceCentreId: string): Promise<ServiceCentre | HttpStatusCode> {
    return this.dataApiRequests.getServiceCentreById(serviceCentreId);
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
      this.dataApiRequests.getServiceCentreContactDetails(serviceCentreId),
      this.dataApiRequests.getContactDescriptionTypes(),
    ]);

    if (typeof contactDetailsResponse === 'number') {
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
    const contactDetailsResponse = await this.dataApiRequests.getServiceCentreContactDetails(serviceCentreId);
    if (typeof contactDetailsResponse === 'number') {
      return contactDetailsResponse;
    }

    return contactDetailsResponse.find(detail => detail.id === contactDetailId);
  }

  public async getContactDescriptionTypeItems(
    selectedId?: string
  ): Promise<ServiceCentreContactDescriptionTypeItem[] | HttpStatusCode> {
    const contactDescriptionTypesResponse = await this.dataApiRequests.getContactDescriptionTypes();
    if (typeof contactDescriptionTypesResponse === 'number') {
      return contactDescriptionTypesResponse;
    }

    return [
      { text: 'Select', value: '' },
      ...contactDescriptionTypesResponse.map(type => ({
        selected: selectedId === type.id,
        text: type.name,
        value: type.id,
      })),
    ];
  }

  public getEmptyFormValues(): ServiceCentreContactFormValues {
    return {
      contactEmail: '',
      contactExplanation: '',
      contactExplanationCy: '',
      contactMethods: [],
      contactTelephone: '',
    };
  }

  public buildFormValues(contactDetail: ServiceCentreContactDetail): ServiceCentreContactFormValues {
    const contactMethods = [contactDetail.email ? 'email' : null, contactDetail.phoneNumber ? 'phone' : null].filter(
      (value): value is string => Boolean(value)
    );

    return {
      contactEmail: contactDetail.email ?? '',
      contactExplanation: contactDetail.explanation ?? '',
      contactExplanationCy: contactDetail.explanationCy ?? '',
      contactMethods,
      contactTelephone: contactDetail.phoneNumber ?? '',
    };
  }

  public async submitContactDetailFlow(
    options: ServiceCentreContactSubmitFlowOptions
  ): Promise<ServiceCentreContactSubmitFlowOutcome> {
    const submission = this.validate(options.body, options.serviceCentreId);

    if (submission.errorSummary.length) {
      const contactDescriptionTypeItems = await this.getContactDescriptionTypeItems(submission.selectedContactTypeId);
      if (typeof contactDescriptionTypeItems === 'number') {
        return { status: contactDescriptionTypeItems, type: 'save-error' };
      }

      return {
        formViewModel: this.buildValidationFormViewModel(options, submission, contactDescriptionTypeItems),
        type: 'validation-error',
      };
    }

    const saveResult = await this.saveContactDetail(
      options.serviceCentreId,
      submission.payload,
      options.contactDetailId
    );
    if (saveResult instanceof Map) {
      const contactDescriptionTypeItems = await this.getContactDescriptionTypeItems(submission.selectedContactTypeId);
      if (typeof contactDescriptionTypeItems === 'number') {
        return { status: contactDescriptionTypeItems, type: 'save-error' };
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

    if (!saveResult || ![HttpStatusCode.Ok, HttpStatusCode.Created, HttpStatusCode.NoContent].includes(saveResult)) {
      return { status: saveResult ?? HttpStatusCode.InternalServerError, type: 'save-error' };
    }

    const successPanelBody = await this.resolveContactTypeName(submission.payload.serviceCentreContactDescriptionId);
    return {
      successPanelBody,
      type: 'saved',
    };
  }

  public async deleteContactDetail(serviceCentreId: string, contactDetailId: string): Promise<HttpStatusCode> {
    return this.dataApiRequests.deleteServiceCentreContactDetail(serviceCentreId, contactDetailId);
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
    const contactDescriptionTypesResponse = await this.dataApiRequests.getContactDescriptionTypes();
    if (typeof contactDescriptionTypesResponse === 'number') {
      return 'Contact details';
    }

    const matchedType = contactDescriptionTypesResponse.find(type => type.id === contactDescriptionTypeId);
    return matchedType?.name ?? 'Contact details';
  }

  private validate(body: Record<string, unknown>, serviceCentreId: string): ServiceCentreContactSubmission {
    const selectedContactMethods = [body['contact-methods']].flat().filter(Boolean) as string[];
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

    this.validateContactExplanationFields(formValues, formErrors, errorSummary);

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

  private validateContactExplanationFields(
    formValues: ServiceCentreContactFormValues,
    formErrors: ServiceCentreContactFormErrors,
    errorSummary: ServiceCentreContactValidationError[]
  ) {
    const contactExplanationValidity = this.validateContactExplanation(formValues.contactExplanation, false);
    if (contactExplanationValidity) {
      formErrors.contactExplanation = contactExplanationValidity;
      errorSummary.push({ href: '#contact-explanation', text: contactExplanationValidity });
    }

    const contactExplanationCyValidity = this.validateContactExplanation(formValues.contactExplanationCy, true);
    if (contactExplanationCyValidity) {
      formErrors.contactExplanationCy = contactExplanationCyValidity;
      errorSummary.push({ href: '#contact-explanation-cy', text: contactExplanationCyValidity });
    }

    if (formValues.contactExplanation.length > 0 && formValues.contactExplanationCy.length === 0) {
      formErrors.contactExplanationCy =
        'Because you provided an explanation in English, the Welsh translation is now mandatory';
      errorSummary.push({ href: '#contact-explanation-cy', text: formErrors.contactExplanationCy });
    }

    if (formValues.contactExplanationCy.length > 0 && formValues.contactExplanation.length === 0) {
      formErrors.contactExplanation =
        'Because you provided an explanation in Welsh, the English translation is now mandatory';
      errorSummary.push({ href: '#contact-explanation', text: formErrors.contactExplanation });
    }
  }

  private validateContactExplanation(contactExplanation: string, welsh: boolean) {
    const insert = welsh ? 'in Welsh ' : '';
    if (contactExplanation.length > maxExplanationLength) {
      return `Explanation ${insert}must be 250 characters or fewer`;
    } else if (contactExplanation && !explanationPattern.test(contactExplanation)) {
      return `Explanation ${insert}must only include letters, numbers, spaces, apostrophes, hyphens, parentheses, ampersands, and plus signs`;
    }
    return undefined;
  }

  private async saveContactDetail(
    serviceCentreId: string,
    payload: SaveServiceCentreContactDetailRequest,
    contactDetailId?: string
  ): Promise<HttpStatusCode | Map<string, string>> {
    if (contactDetailId) {
      return this.dataApiRequests.updateServiceCentreContactDetail(serviceCentreId, contactDetailId, payload);
    }

    return this.dataApiRequests.createServiceCentreContactDetail(serviceCentreId, payload);
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
    const formErrors: ServiceCentreContactFormErrors = {};
    const errorSummary: ServiceCentreContactValidationError[] = [];
    const fieldMappings: Record<string, { formField: keyof ServiceCentreContactFormErrors; href: string }> = {
      serviceCentreContactDescriptionId: { formField: 'contactType', href: '#contact-type' },
      courtContactDescriptionId: { formField: 'contactType', href: '#contact-type' },
      email: { formField: 'contactEmail', href: '#contact-email' },
      explanation: { formField: 'contactExplanation', href: '#contact-explanation' },
      phoneNumber: { formField: 'contactTelephone', href: '#contact-telephone' },
    };

    for (const [field, message] of apiErrors.entries()) {
      const mapping = fieldMappings[field];
      if (!mapping) {
        errorSummary.push({ href: '#main-content', text: message });
        continue;
      }

      formErrors[mapping.formField] = message;
      errorSummary.push({ href: mapping.href, text: message });
    }

    return { errorSummary, formErrors };
  }
}
