import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtAreaOfLawSelection } from '../schemas/areaOfLawSchema';

export const serviceCentreAreasOfLawValidationMessage =
  'Select at least one type of case heard at this service centre.';

export type ServiceCentreCasesHeardViewModel = {
  areasOfLawError?: string;
  serviceCentreId: string;
  serviceCentreName: string;
  errorSummary: { href: string; text: string }[];
  leftColumnAreasOfLawItems: { checked: boolean; text: string; value: string }[];
  pageTitle: string;
  rightColumnAreasOfLawItems: { checked: boolean; text: string; value: string }[];
};

export type ServiceCentreCasesHeardSuccessViewModel = {
  serviceCentreId: string;
  serviceCentreName: string;
};

export type SaveServiceCentreCasesHeardResult =
  | { type: 'success'; viewModel: ServiceCentreCasesHeardSuccessViewModel }
  | { status: HttpStatusCode; type: 'status' }
  | { type: 'validation_error'; viewModel: ServiceCentreCasesHeardViewModel };

export class ServiceCentreCasesHeardService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public getSelectedAreasOfLaw(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((selectedValue): selectedValue is string => typeof selectedValue === 'string');
    }

    return typeof value === 'string' ? value.split(',') : [];
  }

  public validateSelectedAreasOfLaw(selectedAreasOfLaw: string[]): string | undefined {
    return selectedAreasOfLaw.length === 0 ? serviceCentreAreasOfLawValidationMessage : undefined;
  }

  public async getCasesHeardPage(
    serviceCentreId: string,
    selectedAreasOfLaw?: string[],
    areasOfLawError?: string
  ): Promise<ServiceCentreCasesHeardViewModel | HttpStatusCode> {
    const serviceCentreResponse = await this.dataApiRequests.getServiceCentreById(serviceCentreId);

    if (this.isHttpStatusCode(serviceCentreResponse)) {
      return serviceCentreResponse;
    }

    return this.getCasesHeardViewModel(
      serviceCentreId,
      serviceCentreResponse.name,
      selectedAreasOfLaw,
      areasOfLawError
    );
  }

  public async saveCasesHeard(
    serviceCentreId: string,
    selectedAreasOfLaw: string[]
  ): Promise<SaveServiceCentreCasesHeardResult> {
    const serviceCentreResponse = await this.dataApiRequests.getServiceCentreById(serviceCentreId);

    if (this.isHttpStatusCode(serviceCentreResponse)) {
      return { status: serviceCentreResponse, type: 'status' };
    }

    const areasOfLawError = this.validateSelectedAreasOfLaw(selectedAreasOfLaw);

    if (areasOfLawError) {
      const viewModel = await this.getCasesHeardViewModel(
        serviceCentreId,
        serviceCentreResponse.name,
        selectedAreasOfLaw,
        areasOfLawError
      );

      return this.isHttpStatusCode(viewModel)
        ? { status: viewModel, type: 'status' }
        : { type: 'validation_error', viewModel };
    }

    const updateResponse = await this.dataApiRequests.updateServiceCentreAreasOfLaw({
      areasOfLaw: selectedAreasOfLaw,
      serviceCentreId,
    });

    return updateResponse >= HttpStatusCode.Ok && updateResponse < HttpStatusCode.MultipleChoices
      ? {
          type: 'success',
          viewModel: {
            serviceCentreId,
            serviceCentreName: serviceCentreResponse.name,
          },
        }
      : { status: updateResponse, type: 'status' };
  }

  private async getCasesHeardViewModel(
    serviceCentreId: string,
    serviceCentreName: string,
    selectedAreasOfLaw?: string[],
    areasOfLawError?: string
  ): Promise<ServiceCentreCasesHeardViewModel | HttpStatusCode> {
    const areasOfLawResponse = await this.dataApiRequests.getServiceCentreAreasOfLaw(serviceCentreId);

    if (this.isHttpStatusCode(areasOfLawResponse)) {
      return areasOfLawResponse;
    }

    const selectedAreasOfLawSet = selectedAreasOfLaw === undefined ? null : new Set(selectedAreasOfLaw);
    const areasOfLawItems = areasOfLawResponse.map((selection: CourtAreaOfLawSelection) => {
      const value = selection.areaOfLawType.id || selection.areaOfLawType.name;

      return {
        checked: selectedAreasOfLawSet ? selectedAreasOfLawSet.has(value) : selection.selected,
        text: selection.areaOfLawType.name,
        value,
      };
    });

    const sortedAreasOfLawItems = [...areasOfLawItems].sort((left, right) => left.text.localeCompare(right.text));
    const midpoint = Math.ceil(sortedAreasOfLawItems.length / 2);

    return {
      areasOfLawError,
      errorSummary: areasOfLawError ? [{ href: '#areas-of-law-group', text: areasOfLawError }] : [],
      leftColumnAreasOfLawItems: sortedAreasOfLawItems.slice(0, midpoint),
      pageTitle: areasOfLawError ? `Error: Cases heard - ${serviceCentreName}` : `Cases heard - ${serviceCentreName}`,
      rightColumnAreasOfLawItems: sortedAreasOfLawItems.slice(midpoint),
      serviceCentreId,
      serviceCentreName,
    };
  }

  private isHttpStatusCode(response: unknown): response is HttpStatusCode {
    return typeof response === 'number';
  }
}
