import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';

export const maxServiceCentreWarningNoticeLength = 250;
const warningFormatRegex = /^[A-Za-z0-9.,!?:;'"()\-/&@+\s]+$/;

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
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(serviceCentreId: string): Promise<ServiceCentreWarningNoticeViewModel | HttpStatusCode> {
    const serviceCentreResponse = await this.dataApiRequests.getServiceCentreById(serviceCentreId);
    if (typeof serviceCentreResponse === 'number') {
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
    const serviceCentreResponse = await this.dataApiRequests.getServiceCentreById(serviceCentreId);
    if (typeof serviceCentreResponse === 'number') {
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

    const updateResult = await this.dataApiRequests.updateServiceCentre({
      ...serviceCentreResponse,
      warningNotice: warningNotice.length > 0 ? warningNotice : null,
      warningNoticeCy: warningNoticeCy.length > 0 ? warningNoticeCy : null,
    });

    if (typeof updateResult === 'number') {
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
    const errors: Record<string, string[]> = {};

    const warningNoticeError = this.validateWarningNotice(warningNotice, false);
    if (warningNoticeError) {
      errors.warningNotice = [warningNoticeError];
    }

    if (warningNoticeCy.length > 0 && warningNotice.length === 0) {
      errors.warningNotice = [
        'Because you provided a warning notice in Welsh, the English translation is now mandatory',
      ];
    }

    const warningNoticeCyError = this.validateWarningNotice(warningNoticeCy, true);
    if (warningNoticeCyError) {
      errors.warningNoticeCy = [warningNoticeCyError];
    }

    if (warningNotice.length > 0 && warningNoticeCy.length === 0) {
      errors.warningNoticeCy = [
        'Because you provided a warning notice in English, the Welsh translation is now mandatory',
      ];
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }

  private validateWarningNotice(warningNotice: string, welsh: boolean): string | undefined {
    const insert = welsh ? 'in welsh ' : '';
    if (warningNotice.length > maxServiceCentreWarningNoticeLength) {
      return `Warning notice ${insert}must be ${maxServiceCentreWarningNoticeLength} characters or fewer`;
    } else if (warningNotice.trim().length > 0 && !warningFormatRegex.test(warningNotice)) {
      return `Warning notice ${insert}may only contain letters, numbers, spaces, and standard punctuation or symbols (@, +)`;
    }
    return undefined;
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
    const errors: Record<string, string[]> = {};

    for (const [key, value] of apiErrors) {
      if (key === 'timestamp') {
        continue;
      }
      errors[key] = [value];
    }

    return errors;
  }
}
