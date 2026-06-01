import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { AreaOfLawType, CourtAreaOfLawSelection } from '../schemas/areaOfLawSchema';
import {
  CourtLocalAuthorities,
  CourtLocalAuthoritiesList,
  LocalAuthoritySelection,
} from '../schemas/courtLocalAuthoritiesSchema';
import { LocalAuthorityType } from '../schemas/localAuthorityTypeSchema';

type CasesHeard = {
  Adoption: boolean;
  Children: boolean;
  Divorce: boolean;
};

type CourtTypes = {
  family: boolean;
};

export type LocalAuthoritySelections = {
  Adoption?: CourtLocalAuthorities;
  Children?: CourtLocalAuthorities;
  Divorce?: CourtLocalAuthorities;
};

export type LocalAuthoritiesViewModel = {
  courtId: string;
  courtName: string;
  courtTypes: CourtTypes;
  casesHeard: CasesHeard;
  localAuthoritySelections: LocalAuthoritySelections;
  errors?: Record<string, string[]>;
};

export type LocalAuthoritiesSaveModel = {
  status: 'saved' | 'invalid';
  courtName: string;
  errors?: Record<string, string[]>;
};

export class LocalAuthoritiesService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(courtId: string): Promise<LocalAuthoritiesViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

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
      courtName: courtResponse.name,
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

  public async update(
    courtId: string,
    selections: LocalAuthoritySelections
  ): Promise<LocalAuthoritiesSaveModel | HttpStatusCode> {
    // retrieve the court as we'll need its name
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    const updatePayload: CourtLocalAuthoritiesList = (['Adoption', 'Children', 'Divorce'] as const)
      .map(area => selections[area])
      .filter((selection): selection is CourtLocalAuthorities => !!selection);

    const updateResponse = await this.dataApiRequests.updateCourtLocalAuthorities(courtId, updatePayload);
    if (typeof updateResponse === 'number') {
      return updateResponse;
    }

    // if it's a Map, it's errors from the API
    if (updateResponse instanceof Map) {
      // convert the mapped errors into our expected error format
      const errors: Record<string, string[]> = {};
      for (const [key, value] of updateResponse) {
        errors[key] = [value];
      }

      return {
        status: 'invalid',
        courtName: courtResponse.name,
        errors,
      };
    }

    return {
      status: 'saved',
      courtName: courtResponse.name,
    };
  }

  // extracts cases heard from either the court areas of law response or the local
  // authority selections, depending on which is passed in
  private extractCasesHeard(casesHeard: CourtAreaOfLawSelection[] | LocalAuthoritySelections): CasesHeard {
    if (Array.isArray(casesHeard)) {
      return {
        Adoption: casesHeard.some(selection => selection.areaOfLawType.name === 'Adoption'),
        Children: casesHeard.some(selection => selection.areaOfLawType.name === 'Children'),
        Divorce: casesHeard.some(selection => selection.areaOfLawType.name === 'Divorce'),
      };
    }
    return { Adoption: !!casesHeard.Adoption, Children: !!casesHeard.Children, Divorce: !!casesHeard.Divorce };
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
        areaOfLawId: areasOfLaw.find(aol => aol.name === areaOfLaw)?.id ?? '',
        localAuthorities: selections,
      };
    }

    return localAuthoritySelections;
  }
}
