import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtAreaOfLawSelection } from '../schemas/areaOfLawSchema';

export const areasOfLawValidationMessage = 'Select at least one type of case heard at this court.';

export type CasesHeardViewModel = {
  areasOfLawError?: string;
  courtId: string;
  courtName: string;
  errorSummary: { href: string; text: string }[];
  leftColumnAreasOfLawItems: { checked: boolean; text: string; value: string }[];
  pageTitle: string;
  rightColumnAreasOfLawItems: { checked: boolean; text: string; value: string }[];
};

export type CasesHeardSuccessViewModel = {
  courtId: string;
  courtName: string;
};

export type SaveCasesHeardResult =
  | { type: 'success'; viewModel: CasesHeardSuccessViewModel }
  | { status: HttpStatusCode; type: 'status' }
  | { type: 'validation_error'; viewModel: CasesHeardViewModel };

/**
 * Builds and validates the cases-heard page state independently of HTTP concerns.
 */
export class CasesHeardService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  /**
   * Normalises the incoming checkbox values into a string array.
   */
  public getSelectedAreasOfLaw(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((selectedValue): selectedValue is string => typeof selectedValue === 'string');
    }

    return typeof value === 'string' ? [value] : [];
  }

  /**
   * Applies the minimum-one validation rule for the page.
   */
  public validateSelectedAreasOfLaw(selectedAreasOfLaw: string[]): string | undefined {
    return selectedAreasOfLaw.length === 0 ? areasOfLawValidationMessage : undefined;
  }

  /**
   * Loads the court and areas-of-law data needed to render the form.
   */
  public async getCasesHeardPage(
    courtId: string,
    selectedAreasOfLaw?: string[],
    areasOfLawError?: string
  ): Promise<CasesHeardViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    return this.getCasesHeardViewModel(courtId, courtResponse.name, selectedAreasOfLaw, areasOfLawError);
  }

  /**
   * Validates and saves the cases-heard selection for a court.
   */
  public async saveCasesHeard(courtId: string, selectedAreasOfLaw: string[]): Promise<SaveCasesHeardResult> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (typeof courtResponse === 'number') {
      return { status: courtResponse, type: 'status' };
    }

    const areasOfLawError = this.validateSelectedAreasOfLaw(selectedAreasOfLaw);

    if (areasOfLawError) {
      const viewModel = await this.getCasesHeardViewModel(
        courtId,
        courtResponse.name,
        selectedAreasOfLaw,
        areasOfLawError
      );

      return typeof viewModel === 'number'
        ? { status: viewModel, type: 'status' }
        : { type: 'validation_error', viewModel };
    }

    const updateResponse = await this.dataApiRequests.updateCourtAreasOfLaw({
      areasOfLaw: selectedAreasOfLaw,
      courtId,
    });

    return updateResponse >= HttpStatusCode.Ok && updateResponse < HttpStatusCode.MultipleChoices
      ? {
          type: 'success',
          viewModel: {
            courtId,
            courtName: courtResponse.name,
          },
        }
      : { status: updateResponse, type: 'status' };
  }

  /**
   * Builds the full cases-heard view model from the court areas-of-law response.
   */
  private async getCasesHeardViewModel(
    courtId: string,
    courtName: string,
    selectedAreasOfLaw?: string[],
    areasOfLawError?: string
  ): Promise<CasesHeardViewModel | HttpStatusCode> {
    const courtAreasOfLawResponse = await this.dataApiRequests.getCourtAreasOfLaw(courtId);

    if (typeof courtAreasOfLawResponse === 'number') {
      return courtAreasOfLawResponse;
    }

    const selectedAreasOfLawSet = selectedAreasOfLaw === undefined ? null : new Set(selectedAreasOfLaw);
    const areasOfLawItems = courtAreasOfLawResponse.map((selection: CourtAreaOfLawSelection) => {
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
      courtId,
      courtName,
      errorSummary: areasOfLawError ? [{ href: '#areas-of-law-group', text: areasOfLawError }] : [],
      leftColumnAreasOfLawItems: sortedAreasOfLawItems.slice(0, midpoint),
      pageTitle: areasOfLawError ? `Error: Cases heard - ${courtName}` : `Cases heard - ${courtName}`,
      rightColumnAreasOfLawItems: sortedAreasOfLawItems.slice(midpoint),
    };
  }
}
