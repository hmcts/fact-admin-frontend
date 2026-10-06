import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { isHttpStatusCode, toSingleValidationErrorRecord } from '../../utils/apiResponses';
import { validateBilingualTextPair } from '../../utils/bilingualTextValidation';
import {
  ENGLISH_WARNING_NOTICE_REQUIRED_MESSAGE,
  WARNING_NOTICE_INVALID_CHARACTERS_MESSAGE,
  WARNING_NOTICE_MAX_LENGTH,
  WARNING_NOTICE_MAX_LENGTH_MESSAGE,
  WELSH_WARNING_NOTICE_INVALID_CHARACTERS_MESSAGE,
  WELSH_WARNING_NOTICE_MAX_LENGTH_MESSAGE,
  WELSH_WARNING_NOTICE_REQUIRED_MESSAGE,
} from '../../utils/constants/messageConstants';
import { ENGLISH_WARNING_NOTICE_REGEX, WELSH_WARNING_NOTICE_REGEX } from '../../utils/constants/regexConstants';
import { toErrorSummary } from '../../utils/formHelpers';

export type WarningNoticeForm = {
  warningNotice?: string;
  warningNoticeCy?: string;
};

export type WarningNoticeViewModel = {
  courtId: string;
  courtName: string;
  form: WarningNoticeForm;
  errors: Record<string, string>;
  errorSummary: { href: string; text: string }[];
  pageTitle: string;
};

export type WarningNoticeSuccessViewModel = {
  courtId: string;
  courtName: string;
};

export type SaveWarningNoticeResult =
  | { type: 'success'; viewModel: WarningNoticeSuccessViewModel }
  | { type: 'validation_error'; viewModel: WarningNoticeViewModel }
  | { type: 'status'; status: HttpStatusCode };

export class CourtWarningNoticeService {
  public constructor(private readonly courtApi = new CourtApi()) {}

  public async getWarningNoticePage(courtId: string): Promise<WarningNoticeViewModel | HttpStatusCode> {
    const courtResponse = await this.courtApi.getCourtById(courtId);

    if (isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    return {
      courtId,
      courtName: courtResponse.name,
      form: {
        warningNotice: courtResponse.warningNotice ?? '',
        warningNoticeCy: courtResponse.warningNoticeCy ?? '',
      },
      errors: {},
      errorSummary: [],
      pageTitle: `Warning notice - ${courtResponse.name}`,
    };
  }

  public async save(courtId: string, form: WarningNoticeForm): Promise<SaveWarningNoticeResult> {
    const courtResponse = await this.courtApi.getCourtById(courtId);

    if (isHttpStatusCode(courtResponse)) {
      return { status: courtResponse, type: 'status' };
    }

    const errors = this.validate(form);

    if (Object.keys(errors).length > 0) {
      return {
        type: 'validation_error',
        viewModel: {
          courtId,
          courtName: courtResponse.name,
          form,
          errors,
          errorSummary: toErrorSummary(errors),
          pageTitle: `Error: Warning notice - ${courtResponse.name}`,
        },
      };
    }

    const { warningNotice, warningNoticeCy } = form;
    const payload = {
      ...courtResponse,
      warningNotice: warningNotice?.trim() || null,
      warningNoticeCy: warningNoticeCy?.trim() || null,
    };

    const updateResponse = await this.courtApi.updateCourt(payload);

    if (updateResponse instanceof Map) {
      const apiErrors = toSingleValidationErrorRecord(updateResponse);
      return {
        type: 'validation_error',
        viewModel: {
          courtId,
          courtName: courtResponse.name,
          form,
          errors: apiErrors,
          errorSummary: toErrorSummary(apiErrors),
          pageTitle: `Error: Warning notice - ${courtResponse.name}`,
        },
      };
    }

    if (isHttpStatusCode(updateResponse)) {
      return { status: updateResponse, type: 'status' };
    }

    return {
      type: 'success',
      viewModel: {
        courtId,
        courtName: courtResponse.name,
      },
    };
  }

  private validate(form: WarningNoticeForm): Record<string, string> {
    const { warningNotice, warningNoticeCy } = form;
    return validateBilingualTextPair(warningNotice, warningNoticeCy, {
      englishKey: 'warningNotice',
      englishPattern: ENGLISH_WARNING_NOTICE_REGEX,
      maximumLength: WARNING_NOTICE_MAX_LENGTH,
      messages: {
        englishInvalidCharacters: WARNING_NOTICE_INVALID_CHARACTERS_MESSAGE,
        englishMaximumLength: WARNING_NOTICE_MAX_LENGTH_MESSAGE,
        englishRequired: ENGLISH_WARNING_NOTICE_REQUIRED_MESSAGE,
        welshInvalidCharacters: WELSH_WARNING_NOTICE_INVALID_CHARACTERS_MESSAGE,
        welshMaximumLength: WELSH_WARNING_NOTICE_MAX_LENGTH_MESSAGE,
        welshRequired: WELSH_WARNING_NOTICE_REQUIRED_MESSAGE,
      },
      welshKey: 'warningNoticeCy',
      welshPattern: WELSH_WARNING_NOTICE_REGEX,
    });
  }
}
