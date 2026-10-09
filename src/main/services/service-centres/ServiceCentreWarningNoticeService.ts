import { HttpStatusCode } from 'axios';

import { ServiceCentreApi } from '../../requests/ServiceCentreApi';
import { isHttpStatusCode, toValidationErrorRecord } from '../../utils/apiResponses';
import { validateBilingualTextPair } from '../../utils/bilingualTextValidation';
import {
  ENGLISH_WARNING_NOTICE_REQUIRED_MESSAGE,
  MAX_SERVICE_CENTRE_WARNING_NOTICE_LENGTH,
  WELSH_WARNING_NOTICE_REQUIRED_MESSAGE,
} from '../../utils/constants/messageConstants';
import { ENGLISH_WARNING_NOTICE_REGEX, WELSH_WARNING_NOTICE_REGEX } from '../../utils/constants/regexConstants';

export type ServiceCentreWarningNoticeViewModel = {
  errors?: Record<string, string[]>;
  id: string;
  name: string;
  pageTitle: string;
  warningNotice: string;
  warningNoticeCy: string;
};

export type SaveServiceCentreWarningNoticeResult =
  | {
      type: 'saved';
      viewModel: ServiceCentreWarningNoticeViewModel;
    }
  | {
      type: 'validation-error';
      viewModel: ServiceCentreWarningNoticeViewModel;
    }
  | {
      status: HttpStatusCode;
      type: 'status';
    };

export class ServiceCentreWarningNoticeService {
  public constructor(private readonly serviceCentreApi = new ServiceCentreApi()) {}

  public async retrieve(serviceCentreId: string): Promise<ServiceCentreWarningNoticeViewModel | HttpStatusCode> {
    const serviceCentreResponse = await this.serviceCentreApi.getServiceCentreById(serviceCentreId);
    if (isHttpStatusCode(serviceCentreResponse)) {
      return serviceCentreResponse;
    }

    return this.toViewModel(
      serviceCentreResponse.id,
      serviceCentreResponse.name,
      serviceCentreResponse.warningNotice,
      serviceCentreResponse.warningNoticeCy
    );
  }

  public async save(
    serviceCentreId: string,
    warningNoticeInput: string | undefined,
    warningNoticeCyInput: string | undefined
  ): Promise<SaveServiceCentreWarningNoticeResult> {
    const serviceCentreResponse = await this.serviceCentreApi.getServiceCentreById(serviceCentreId);
    if (isHttpStatusCode(serviceCentreResponse)) {
      return { status: serviceCentreResponse, type: 'status' };
    }

    const warningNotice = warningNoticeInput?.trim() ?? '';
    const warningNoticeCy = warningNoticeCyInput?.trim() ?? '';
    const validationErrors = this.validateWarningNotices(warningNotice, warningNoticeCy);
    if (validationErrors) {
      return {
        type: 'validation-error',
        viewModel: this.toViewModel(
          serviceCentreId,
          serviceCentreResponse.name,
          warningNotice,
          warningNoticeCy,
          validationErrors
        ),
      };
    }

    const updateResult = await this.serviceCentreApi.updateServiceCentre({
      ...serviceCentreResponse,
      warningNotice: warningNotice.length > 0 ? warningNotice : null,
      warningNoticeCy: warningNoticeCy.length > 0 ? warningNoticeCy : null,
    });

    if (isHttpStatusCode(updateResult)) {
      return { status: updateResult, type: 'status' };
    }

    if (updateResult instanceof Map) {
      return {
        type: 'validation-error',
        viewModel: this.toViewModel(
          serviceCentreId,
          serviceCentreResponse.name,
          warningNotice,
          warningNoticeCy,
          this.mapApiValidationErrors(updateResult)
        ),
      };
    }

    return {
      type: 'saved',
      viewModel: this.toViewModel(
        updateResult.id,
        updateResult.name,
        updateResult.warningNotice,
        updateResult.warningNoticeCy
      ),
    };
  }

  private validateWarningNotices(warningNotice: string, warningNoticeCy: string): Record<string, string[]> | undefined {
    const errors = validateBilingualTextPair(warningNotice, warningNoticeCy, {
      englishKey: 'warningNotice',
      englishPattern: ENGLISH_WARNING_NOTICE_REGEX,
      maximumLength: MAX_SERVICE_CENTRE_WARNING_NOTICE_LENGTH,
      messages: {
        englishInvalidCharacters:
          'Warning notice must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses',
        englishMaximumLength: `Warning notice must be ${MAX_SERVICE_CENTRE_WARNING_NOTICE_LENGTH} characters or fewer`,
        englishRequired: ENGLISH_WARNING_NOTICE_REQUIRED_MESSAGE,
        welshInvalidCharacters:
          'Warning notice in Welsh must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses',
        welshMaximumLength: `Warning notice in Welsh must be ${MAX_SERVICE_CENTRE_WARNING_NOTICE_LENGTH} characters or fewer`,
        welshRequired: WELSH_WARNING_NOTICE_REQUIRED_MESSAGE,
      },
      validatePatternWhenTooLong: false,
      welshKey: 'warningNoticeCy',
      welshPattern: WELSH_WARNING_NOTICE_REGEX,
    });

    return Object.keys(errors).length > 0
      ? Object.fromEntries(Object.entries(errors).map(([key, message]) => [key, [message]]))
      : undefined;
  }

  private toViewModel(
    id: string,
    name: string,
    warningNotice: string | null | undefined,
    warningNoticeCy: string | null | undefined,
    errors?: Record<string, string[]>
  ): ServiceCentreWarningNoticeViewModel {
    return {
      errors,
      id,
      name,
      pageTitle: errors ? `Error: Warning notice - ${name}` : `Warning notice - ${name}`,
      warningNotice: warningNotice ?? '',
      warningNoticeCy: warningNoticeCy ?? '',
    };
  }

  private mapApiValidationErrors(apiErrors: Map<string, string>): Record<string, string[]> {
    return toValidationErrorRecord(apiErrors);
  }
}
