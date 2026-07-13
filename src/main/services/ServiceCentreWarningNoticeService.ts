import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';

export const maxServiceCentreWarningNoticeLength = 250;

export type ServiceCentreWarningNoticeViewModel = {
  errors?: Record<string, string[]>;
  id: string;
  name: string;
  pageTitle: string;
  warningNotice: string;
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

    return this.toViewModel(serviceCentreResponse.id, serviceCentreResponse.name, serviceCentreResponse.warningNotice);
  }

  public async save(
    serviceCentreId: string,
    warningNoticeInput: string | undefined
  ): Promise<SaveServiceCentreWarningNoticeResult> {
    const serviceCentreResponse = await this.dataApiRequests.getServiceCentreById(serviceCentreId);
    if (typeof serviceCentreResponse === 'number') {
      return { status: serviceCentreResponse, type: 'status' };
    }

    const warningNotice = warningNoticeInput?.trim() ?? '';
    const validationErrors = this.validateWarningNotice(warningNotice);
    if (validationErrors) {
      return {
        type: 'validation-error',
        viewModel: this.toViewModel(serviceCentreId, serviceCentreResponse.name, warningNotice, validationErrors),
      };
    }

    const updateResult = await this.dataApiRequests.updateServiceCentre({
      ...serviceCentreResponse,
      warningNotice: warningNotice.length > 0 ? warningNotice : null,
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
          this.mapApiValidationErrors(updateResult)
        ),
      };
    }

    return {
      type: 'saved',
      viewModel: this.toViewModel(updateResult.id, updateResult.name, updateResult.warningNotice),
    };
  }

  private validateWarningNotice(warningNotice: string): Record<string, string[]> | undefined {
    if (warningNotice.length <= maxServiceCentreWarningNoticeLength) {
      return undefined;
    }

    return {
      warningNotice: [`Warning notice must be ${maxServiceCentreWarningNoticeLength} characters or fewer`],
    };
  }

  private toViewModel(
    id: string,
    name: string,
    warningNotice: string | null | undefined,
    errors?: Record<string, string[]>
  ): ServiceCentreWarningNoticeViewModel {
    return {
      errors,
      id,
      name,
      pageTitle: errors ? `Error: Warning notice - ${name}` : `Warning notice - ${name}`,
      warningNotice: warningNotice ?? '',
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
