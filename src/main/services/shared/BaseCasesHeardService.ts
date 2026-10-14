import { HttpStatusCode } from 'axios';

import { CourtAreaOfLawSelection } from '../../schemas/areaOfLawSchema';
import { isHttpStatusCode, isSuccessfulHttpStatus } from '../../utils/apiResponses';
import { normaliseSelectedValues, sortAndSplitIntoColumns } from '../../utils/formHelpers';

export type CasesHeardCheckboxItem = {
  checked: boolean;
  text: string;
  value: string;
};

export type CasesHeardViewContext = {
  allItems: CasesHeardCheckboxItem[];
  error?: string;
  id: string;
  leftItems: CasesHeardCheckboxItem[];
  name: string;
  rightItems: CasesHeardCheckboxItem[];
};

export type BaseSaveCasesHeardResult<TViewModel, TSuccessViewModel> =
  | { type: 'success'; viewModel: TSuccessViewModel }
  | { status: HttpStatusCode; type: 'status' }
  | { type: 'validation_error'; viewModel: TViewModel };

export abstract class BaseCasesHeardService<TViewModel, TSuccessViewModel> {
  protected constructor(private readonly validationMessage: string) {}

  public getSelectedAreasOfLaw(value: unknown): string[] {
    return normaliseSelectedValues(value, { splitCommas: true });
  }

  public validateSelectedAreasOfLaw(selectedAreasOfLaw: string[]): string | undefined {
    return selectedAreasOfLaw.length === 0 ? this.validationMessage : undefined;
  }

  public async getCasesHeardPage(
    id: string,
    selectedAreasOfLaw?: string[],
    error?: string
  ): Promise<TViewModel | HttpStatusCode> {
    const subject = await this.getSubject(id);
    if (isHttpStatusCode(subject)) {
      return subject;
    }

    return this.getCasesHeardViewModel(id, subject.name, selectedAreasOfLaw, error);
  }

  public async saveCasesHeard(
    id: string,
    selectedAreasOfLaw: string[]
  ): Promise<BaseSaveCasesHeardResult<TViewModel, TSuccessViewModel>> {
    const subject = await this.getSubject(id);
    if (isHttpStatusCode(subject)) {
      return { status: subject, type: 'status' };
    }

    const error = this.validateSelectedAreasOfLaw(selectedAreasOfLaw);
    if (error) {
      const viewModel = await this.getCasesHeardViewModel(id, subject.name, selectedAreasOfLaw, error);
      return isHttpStatusCode(viewModel)
        ? { status: viewModel, type: 'status' }
        : { type: 'validation_error', viewModel };
    }

    const updateResponse = await this.updateAreasOfLaw(id, selectedAreasOfLaw);
    return isSuccessfulHttpStatus(updateResponse)
      ? { type: 'success', viewModel: this.buildSuccessViewModel(id, subject.name) }
      : { status: updateResponse, type: 'status' };
  }

  protected abstract getSubject(id: string): Promise<{ name: string } | HttpStatusCode>;

  protected abstract getAreasOfLaw(id: string): Promise<CourtAreaOfLawSelection[] | HttpStatusCode>;

  protected abstract updateAreasOfLaw(id: string, selectedAreasOfLaw: string[]): Promise<HttpStatusCode>;

  protected abstract buildViewModel(context: CasesHeardViewContext): TViewModel;

  protected abstract buildSuccessViewModel(id: string, name: string): TSuccessViewModel;

  private async getCasesHeardViewModel(
    id: string,
    name: string,
    selectedAreasOfLaw?: string[],
    error?: string
  ): Promise<TViewModel | HttpStatusCode> {
    const response = await this.getAreasOfLaw(id);
    if (isHttpStatusCode(response)) {
      return response;
    }

    const selectedIds = selectedAreasOfLaw === undefined ? null : new Set(selectedAreasOfLaw);
    const items = response.map(selection => {
      const value = selection.areaOfLawType.id || selection.areaOfLawType.name;
      return {
        checked: selectedIds ? selectedIds.has(value) : selection.selected,
        text: selection.areaOfLawType.name,
        value,
      };
    });
    const columns = sortAndSplitIntoColumns(items, item => item.text);

    return this.buildViewModel({
      allItems: [...columns.left, ...columns.right],
      error,
      id,
      leftItems: columns.left,
      name,
      rightItems: columns.right,
    });
  }
}
