import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { AreaOfLawType, CourtAreaOfLawSelection } from '../schemas/areaOfLawSchema';
import { CourtLocalAuthoritiesList, LocalAuthoritySelection } from '../schemas/courtLocalAuthoritiesSchema';
import { LocalAuthorityType } from '../schemas/localAuthorityTypeSchema';

type CasesHeard = {
  Adoption: boolean;
  Children: boolean;
  Divorce: boolean;
};

type CourtTypes = {
  family: boolean;
};

type LocalAuthoritySelections = {
  Adoption?: {
    id: string;
    selections: LocalAuthoritySelection[];
  };
  Children?: {
    id: string;
    selections: LocalAuthoritySelection[];
  };
  Divorce?: {
    id: string;
    selections: LocalAuthoritySelection[];
  };
};

export type LocalAuthoritiesViewModel =
  | {
      courtId: string;
      courtTypes: CourtTypes;
      casesHeard: CasesHeard;
      localAuthoritySelections: LocalAuthoritySelections;
      errors?: Record<string, string[]>;
    }
  | HttpStatusCode;

export class LocalAuthoritiesService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(courtId: string): Promise<LocalAuthoritiesViewModel> {
    // we need the complete set of local authorities to ensure we set up the model correctly
    const localAuthoritiesResponse = await this.dataApiRequests.getLocalAuthorities();
    if (typeof localAuthoritiesResponse === 'number') {
      return localAuthoritiesResponse;
    }

    // and we need the complete set of areas of law
    const areasOfLawResponse = await this.dataApiRequests.getAreasOfLaw();
    if (typeof areasOfLawResponse === 'number') {
      return areasOfLawResponse;
    }

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

    const casesHeard: CasesHeard = this.extractCasesHeard(casesHeardResponse);

    return {
      courtId,
      localAuthoritySelections: this.buildCourtLocalAuthoritiesModelData(
        localAuthoritiesResponse,
        areasOfLawResponse,
        courtLocalAuthoritiesResponse,
        casesHeard
      ),
      courtTypes: {
        family: !!professionalInformationResponse.codes?.familyCourtCode,
      },
      casesHeard,
    };
  }

  private extractCasesHeard(casesHeard: CourtAreaOfLawSelection[]): CasesHeard {
    return {
      Adoption: casesHeard.some(selection => selection.areaOfLawType.name === 'Adoption'),
      Children: casesHeard.some(selection => selection.areaOfLawType.name === 'Children'),
      Divorce: casesHeard.some(selection => selection.areaOfLawType.name === 'Divorce'),
    };
  }

  private buildCourtLocalAuthoritiesModelData(
    localAuthorities: LocalAuthorityType[],
    areasOfLaw: AreaOfLawType[],
    existingCourtLocalAuthorities: CourtLocalAuthoritiesList,
    casesHeard: CasesHeard
  ): LocalAuthoritySelections {
    const localAuthoritySelections: LocalAuthoritySelections = {};

    const areaOfLawNames = (['Adoption', 'Children', 'Divorce'] as const).filter(area => casesHeard[area]);

    for (const areaOfLaw of areaOfLawNames) {
      const selections: LocalAuthoritySelection[] = localAuthorities.map(la => ({
        id: la.id,
        name: la.name,
        selected:
          existingCourtLocalAuthorities
            .find(cla => cla.areaOfLawName === areaOfLaw)
            ?.localAuthorities.some(courtLA => courtLA.id === la.id && courtLA.selected) ?? false,
      }));

      localAuthoritySelections[areaOfLaw] = {
        id: areasOfLaw.find(aol => aol.name === areaOfLaw)?.id ?? '',
        selections,
      };
    }

    return localAuthoritySelections;
  }
}
