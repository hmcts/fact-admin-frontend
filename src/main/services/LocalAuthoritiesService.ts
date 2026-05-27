import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtAreaOfLawSelection } from '../schemas/areaOfLawSchema';
import { CourtLocalAuthoritiesList } from '../schemas/localAuthoritiesSchema';

export type LocalAuthoritiesViewModel =
  | ({
      courLocalAuthorities: CourtLocalAuthoritiesList
      hasFamilyCourtType: boolean;
      hasAdoptionCasesHeard: boolean;
      hasChildcareCasesHeard: boolean;
      hasDivorceCasesHeard: boolean;
      errors?: Record<string, string[]>;
    })
  | HttpStatusCode;

export class LocalAuthoritiesService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(courtId: string): Promise<LocalAuthoritiesViewModel> {
    // we need to pull professional information to determine if this court has the family court type
    const professionalInformationResponse = await this.dataApiRequests.getCourtProfessionalInformation(courtId);
    if (typeof professionalInformationResponse === 'number') {
      return professionalInformationResponse;
    }

    // we need the cases heard in order to determine which areas of family law are handled
    const casesHeardResponse = await this.dataApiRequests.getCourtAreasOfLaw(courtId);
    if (typeof casesHeardResponse === 'number') {
      return casesHeardResponse;
    }

    // and we'll need whatever configuration is currently in place
    const courtLocalAuthoritiesResponse = await this.dataApiRequests.getCourtLocalAuthorities(courtId);
    if (typeof courtLocalAuthoritiesResponse === 'number') {
      return courtLocalAuthoritiesResponse;
    }

    return {
      courLocalAuthorities: courtLocalAuthoritiesResponse,
      hasFamilyCourtType: !!professionalInformationResponse.codes?.familyCourtCode,
      ...this.extractCasesHeard(casesHeardResponse),
    };
  }

  private extractCasesHeard(casesHeard: CourtAreaOfLawSelection[]): {
    hasAdoptionCasesHeard: boolean;
    hasChildcareCasesHeard: boolean;
    hasDivorceCasesHeard: boolean;
  } {
    return {
      hasAdoptionCasesHeard: casesHeard.some(selection => selection.areaOfLawType.name === 'Adoption'),
      hasChildcareCasesHeard: casesHeard.some(selection => selection.areaOfLawType.name === 'Children'),
      hasDivorceCasesHeard: casesHeard.some(selection => selection.areaOfLawType.name === 'Divorce'),
    };
  }
}
