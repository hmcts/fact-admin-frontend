import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { CourtAreaOfLawSelection } from '../../schemas/areaOfLawSchema';
import { AREA_OF_LAW_VALIDATION_MESSAGE } from '../../utils/constants/messageConstants';
import {
  BaseCasesHeardService,
  BaseSaveCasesHeardResult,
  CasesHeardViewContext,
} from '../shared/BaseCasesHeardService';

export type CasesHeardViewModel = {
  areasOfLawError?: string;
  courtId: string;
  courtName: string;
  errorSummary: { href: string; text: string }[];
  leftColumnAreasOfLawItems: { checked: boolean; text: string; value: string }[];
  pageTitle: string;
  rightColumnAreasOfLawItems: { checked: boolean; text: string; value: string }[];
  confirmRemovalAreasOfLaw: {
    adoption: string | undefined;
    children: string | undefined;
    divorce: string | undefined;
  };
};

export type CasesHeardSuccessViewModel = {
  courtId: string;
  courtName: string;
};

export type SaveCasesHeardResult = BaseSaveCasesHeardResult<CasesHeardViewModel, CasesHeardSuccessViewModel>;

export class CourtCasesHeardService extends BaseCasesHeardService<CasesHeardViewModel, CasesHeardSuccessViewModel> {
  public constructor(private readonly courtApi = new CourtApi()) {
    super(AREA_OF_LAW_VALIDATION_MESSAGE);
  }

  protected getSubject(courtId: string): Promise<{ name: string } | HttpStatusCode> {
    return this.courtApi.getCourtById(courtId);
  }

  protected getAreasOfLaw(courtId: string): Promise<CourtAreaOfLawSelection[] | HttpStatusCode> {
    return this.courtApi.getCourtAreasOfLaw(courtId);
  }

  protected updateAreasOfLaw(courtId: string, selectedAreasOfLaw: string[]): Promise<HttpStatusCode> {
    return this.courtApi.updateCourtAreasOfLaw({ areasOfLaw: selectedAreasOfLaw, courtId });
  }

  protected buildViewModel(context: CasesHeardViewContext): CasesHeardViewModel {
    return {
      areasOfLawError: context.error,
      courtId: context.id,
      courtName: context.name,
      errorSummary: context.error ? [{ href: '#areas-of-law-group', text: context.error }] : [],
      leftColumnAreasOfLawItems: context.leftItems,
      pageTitle: context.error ? `Error: Cases heard - ${context.name}` : `Cases heard - ${context.name}`,
      rightColumnAreasOfLawItems: context.rightItems,
      confirmRemovalAreasOfLaw: {
        adoption: context.allItems.find(item => item.text === 'Adoption' && item.checked)?.value,
        children: context.allItems.find(item => item.text === 'Children' && item.checked)?.value,
        divorce: context.allItems.find(item => item.text === 'Divorce' && item.checked)?.value,
      },
    };
  }

  protected buildSuccessViewModel(courtId: string, courtName: string): CasesHeardSuccessViewModel {
    return { courtId, courtName };
  }
}
