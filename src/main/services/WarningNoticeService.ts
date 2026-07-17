import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { isHttpStatusCode } from '../utils/valueParsers';

const ENGLISH_WARNING_NOTICE_ALLOWED_CHARACTERS = /^[\p{L}\p{N}\s.,'":;()!?-]*$/u;

const WELSH_WARNING_NOTICE_ALLOWED_CHARACTERS = /^[\p{L}\p{N}\s.,'":;()!?-]*$/u;

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

export class WarningNoticeService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async getWarningNoticePage(courtId: string): Promise<WarningNoticeViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

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
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

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
          errorSummary: this.toErrorSummary(errors),
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

    const updateResponse = await this.dataApiRequests.updateCourt(payload);

    if (updateResponse instanceof Map) {
      const apiErrors: Record<string, string> = {};
      for (const [key, value] of updateResponse) {
        apiErrors[key] = value;
      }
      return {
        type: 'validation_error',
        viewModel: {
          courtId,
          courtName: courtResponse.name,
          form,
          errors: apiErrors,
          errorSummary: this.toErrorSummary(apiErrors),
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
    const errors: Record<string, string> = {};

    const { warningNotice, warningNoticeCy } = form;
    if (warningNotice && !warningNoticeCy) {
      errors.warningNoticeCy = 'Because you provided an explanation in English, the Welsh translation is now mandatory';
    }

    if (warningNoticeCy && !warningNotice) {
      errors.warningNotice = 'Because you provided an explanation in Welsh, the English translation is now mandatory';
    }

    if (warningNotice && warningNotice.length > 250) {
      errors.warningNotice = 'Warning notice must be 250 characters or less';
    }

    if (warningNoticeCy && warningNoticeCy.length > 250) {
      errors.warningNoticeCy = 'Welsh warning notice must be 250 characters or less';
    }

    if (warningNotice && !ENGLISH_WARNING_NOTICE_ALLOWED_CHARACTERS.test(warningNotice)) {
      errors.warningNotice = 'Warning notice contains invalid characters';
    }

    if (warningNoticeCy && !WELSH_WARNING_NOTICE_ALLOWED_CHARACTERS.test(warningNoticeCy)) {
      errors.warningNoticeCy = 'Welsh warning notice contains invalid characters';
    }

    return errors;
  }

  private toErrorSummary(errors: Record<string, string>): { href: string; text: string }[] {
    return Object.entries(errors).map(([field, text]) => ({ href: `#${field}`, text }));
  }
}
