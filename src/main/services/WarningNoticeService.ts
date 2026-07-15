import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';

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

  public async getPage(courtId: string): Promise<WarningNoticeViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
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

    if (this.isHttpStatusCode(courtResponse)) {
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

    const payload = {
      ...courtResponse,
      warningNotice: form.warningNotice?.trim() || null,
      warningNoticeCy: form.warningNoticeCy?.trim() || null,
    };

    console.log(
      '== Warning notice ==',
      JSON.stringify({
        warningNotice: payload.warningNotice,
        warningNoticeCy: payload.warningNoticeCy,
      })
    );

    const updateResponse = await this.dataApiRequests.updateCourt(payload);

    if (this.isHttpStatusCode(updateResponse)) {
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

    if (form.warningNotice && !form.warningNoticeCy) {
      errors.warningNoticeCy = 'Because you provided an explanation in English, the Welsh translation is now mandatory';
    }

    if (form.warningNoticeCy && !form.warningNotice) {
      errors.warningNotice = 'Because you provided an explanation in Welsh, the English translation is now mandatory';
    }

    if (form.warningNotice && form.warningNotice.length > 250) {
      errors.warningNotice = 'Warning notice must be 250 characters or less';
    }

    if (form.warningNoticeCy && form.warningNoticeCy.length > 250) {
      errors.warningNoticeCy = 'Welsh warning notice must be 250 characters or less';
    }

    return errors;
  }

  private toErrorSummary(errors: Record<string, string>): { href: string; text: string }[] {
    return Object.entries(errors).map(([field, text]) => ({ href: `#${field}`, text }));
  }

  private isHttpStatusCode(value: unknown): value is HttpStatusCode {
    return typeof value === 'number';
  }
}
