import { HttpStatusCode } from 'axios';

import { ServiceCentreApi } from '../../requests/ServiceCentreApi';
import { CourtAreaOfLawSelection } from '../../schemas/areaOfLawSchema';
import { SERVICE_CENTRE_AREAS_OF_LAW_VALIDATION_MESSAGE } from '../../utils/constants/messageConstants';
import {
  BaseCasesHeardService,
  BaseSaveCasesHeardResult,
  CasesHeardViewContext,
} from '../shared/BaseCasesHeardService';

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

export type SaveServiceCentreCasesHeardResult = BaseSaveCasesHeardResult<
  ServiceCentreCasesHeardViewModel,
  ServiceCentreCasesHeardSuccessViewModel
>;

export class ServiceCentreCasesHeardService extends BaseCasesHeardService<
  ServiceCentreCasesHeardViewModel,
  ServiceCentreCasesHeardSuccessViewModel
> {
  public constructor(private readonly serviceCentreApi = new ServiceCentreApi()) {
    super(SERVICE_CENTRE_AREAS_OF_LAW_VALIDATION_MESSAGE);
  }

  protected getSubject(serviceCentreId: string): Promise<{ name: string } | HttpStatusCode> {
    return this.serviceCentreApi.getServiceCentreById(serviceCentreId);
  }

  protected getAreasOfLaw(serviceCentreId: string): Promise<CourtAreaOfLawSelection[] | HttpStatusCode> {
    return this.serviceCentreApi.getServiceCentreAreasOfLaw(serviceCentreId);
  }

  protected updateAreasOfLaw(serviceCentreId: string, selectedAreasOfLaw: string[]): Promise<HttpStatusCode> {
    return this.serviceCentreApi.updateServiceCentreAreasOfLaw({ areasOfLaw: selectedAreasOfLaw, serviceCentreId });
  }

  protected buildViewModel(context: CasesHeardViewContext): ServiceCentreCasesHeardViewModel {
    return {
      areasOfLawError: context.error,
      errorSummary: context.error ? [{ href: '#areas-of-law-group', text: context.error }] : [],
      leftColumnAreasOfLawItems: context.leftItems,
      pageTitle: context.error ? `Error: Cases heard - ${context.name}` : `Cases heard - ${context.name}`,
      rightColumnAreasOfLawItems: context.rightItems,
      serviceCentreId: context.id,
      serviceCentreName: context.name,
    };
  }

  protected buildSuccessViewModel(
    serviceCentreId: string,
    serviceCentreName: string
  ): ServiceCentreCasesHeardSuccessViewModel {
    return { serviceCentreId, serviceCentreName };
  }
}
