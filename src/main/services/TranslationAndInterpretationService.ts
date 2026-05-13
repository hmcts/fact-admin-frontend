import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { TranslationServices } from '../schemas/translationServicesSchema';

export type TranslationAndInterpretationForm = {
  contactMethods?: string | string[];
  email?: string;
  phoneNumber?: string;
};

export type TranslationAndInterpretationValidationError = {
  href: string;
  text: string;
};

export type TranslationAndInterpretationViewModel = {
  courtId: string;
  courtName: string;
  email: string;
  emailError?: string;
  emailSelected: boolean;
  errorSummary: TranslationAndInterpretationValidationError[];
  phoneNumber: string;
  phoneNumberError?: string;
  phoneNumberSelected: boolean;
};

export type SaveTranslationAndInterpretationResult =
  | {
      status: 'saved';
      viewModel: TranslationAndInterpretationViewModel;
    }
  | {
      status: 'validationError';
      viewModel: TranslationAndInterpretationViewModel;
    }
  | HttpStatusCode;

const emailPattern = /^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const phoneNumberPattern = /^(?:\+44)?[0-9 ]{10,20}$/;

export class TranslationAndInterpretationService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async getViewModel(courtId: string): Promise<TranslationAndInterpretationViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    const translationServicesResponse = await this.dataApiRequests.getTranslationServices(courtId);

    if (typeof translationServicesResponse === 'number') {
      return translationServicesResponse;
    }

    return this.buildViewModel(courtId, courtResponse.name, translationServicesResponse);
  }

  public async save(
    courtId: string,
    form: TranslationAndInterpretationForm
  ): Promise<SaveTranslationAndInterpretationResult> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    const viewModel = this.buildSubmittedViewModel(courtId, courtResponse.name, form);
    const errorSummary = this.validate(viewModel);

    if (errorSummary.length) {
      return {
        status: 'validationError',
        viewModel: {
          ...viewModel,
          emailError: errorSummary.find(error => error.href === '#email')?.text,
          errorSummary,
          phoneNumberError: errorSummary.find(error => error.href === '#phoneNumber')?.text,
        },
      };
    }

    const saveResponse = await this.dataApiRequests.saveTranslationServices(courtId, {
      courtId,
      email: viewModel.email,
      phoneNumber: viewModel.phoneNumber,
    });

    if (typeof saveResponse === 'number' && saveResponse !== HttpStatusCode.NoContent) {
      return saveResponse;
    }

    return {
      status: 'saved',
      viewModel,
    };
  }

  private buildViewModel(
    courtId: string,
    courtName: string,
    translationServices: TranslationServices | null
  ): TranslationAndInterpretationViewModel {
    const email = translationServices?.email || '';
    const phoneNumber = translationServices?.phoneNumber || '';

    return {
      courtId,
      courtName,
      email,
      emailSelected: Boolean(email),
      errorSummary: [],
      phoneNumber,
      phoneNumberSelected: Boolean(phoneNumber),
    };
  }

  private toTranslationServices(courtId: string, form: TranslationAndInterpretationForm): TranslationServices {
    return {
      courtId,
      email: this.isSelected(form.contactMethods, 'email') ? form.email?.trim() || '' : '',
      phoneNumber: this.isSelected(form.contactMethods, 'phoneNumber') ? form.phoneNumber?.trim() || '' : '',
    };
  }

  private buildSubmittedViewModel(
    courtId: string,
    courtName: string,
    form: TranslationAndInterpretationForm
  ): TranslationAndInterpretationViewModel {
    return {
      ...this.buildViewModel(courtId, courtName, this.toTranslationServices(courtId, form)),
      emailSelected: this.isSelected(form.contactMethods, 'email'),
      phoneNumberSelected: this.isSelected(form.contactMethods, 'phoneNumber'),
    };
  }

  private isSelected(contactMethods: string | string[] | undefined, value: string): boolean {
    return Array.isArray(contactMethods) ? contactMethods.includes(value) : contactMethods === value;
  }

  private validate(viewModel: TranslationAndInterpretationViewModel): TranslationAndInterpretationValidationError[] {
    const errors: TranslationAndInterpretationValidationError[] = [];

    if (viewModel.emailSelected && !viewModel.email) {
      errors.push({
        href: '#email',
        text: 'Enter an email address',
      });
    } else if (viewModel.email && !emailPattern.test(viewModel.email)) {
      errors.push({
        href: '#email',
        text: 'Enter an email address in the correct format',
      });
    }

    if (viewModel.phoneNumberSelected && !viewModel.phoneNumber) {
      errors.push({
        href: '#phoneNumber',
        text: 'Enter a telephone number',
      });
    } else if (viewModel.phoneNumber && !phoneNumberPattern.test(viewModel.phoneNumber)) {
      errors.push({
        href: '#phoneNumber',
        text: 'Enter a telephone number in the correct format',
      });
    }

    return errors;
  }
}
