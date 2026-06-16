import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtAreaOfLawSelection } from '../schemas/areaOfLawSchema';
import {
  CourtLocalAuthorities,
  CourtLocalAuthoritiesList,
  LocalAuthoritySelection,
} from '../schemas/courtLocalAuthoritiesSchema';

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
  pageTitle: string;
  errors?: Record<string, string[]>;
};

export type LocalAuthoritiesSaveModel = {
  status: 'saved' | 'invalid';
  courtName: string;
  errors?: Record<string, string[]>;
};

export const allowedLocalAuthorityAreas = new Set(['Adoption', 'Children', 'Divorce']);

const localAuthorityAreas = [...allowedLocalAuthorityAreas] as (keyof LocalAuthoritySelections)[];

export class LocalAuthoritiesService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(courtId: string): Promise<LocalAuthoritiesViewModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    // we need to pull professional information to determine if this court has the family court type
    const professionalInformationResponse = await this.dataApiRequests.getCourtProfessionalInformation(courtId);
    if (typeof professionalInformationResponse === 'number') {
      if (professionalInformationResponse !== HttpStatusCode.NotFound) {
        return professionalInformationResponse;
      }
    }
    const hasFamilyCourtCode =
      typeof professionalInformationResponse === 'number'
        ? false
        : !!professionalInformationResponse?.codes?.familyCourtCode;

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
      localAuthoritySelections: this.buildCourtLocalAuthoritiesModelData(courtLocalAuthoritiesResponse, casesHeard),
      courtTypes: {
        family: hasFamilyCourtCode,
      },
      casesHeard,
      pageTitle: `Local authorities - ${courtResponse.name}`,
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

    const updatePayload: CourtLocalAuthoritiesList = localAuthorityAreas
      .map(area => selections[area])
      .filter((selection): selection is CourtLocalAuthorities => !!selection);

    const updateResponse = await this.dataApiRequests.updateCourtLocalAuthorities(courtId, updatePayload);
    if (typeof updateResponse === 'number' && updateResponse !== HttpStatusCode.Ok) {
      return updateResponse;
    }

    // if it's a Map, it's errors from the API
    if (updateResponse instanceof Map) {
      // convert the mapped errors into our expected error format
      const errors: Record<string, string[]> = {};
      for (const [key, value] of updateResponse) {
        // ignore the timestamp entry when decanting error responses
        if (typeof key === 'string' && key.toLowerCase() === 'timestamp') {
          continue;
        }
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
        Adoption: casesHeard.some(selection => selection.areaOfLawType.name === 'Adoption' && selection.selected),
        Children: casesHeard.some(selection => selection.areaOfLawType.name === 'Children' && selection.selected),
        Divorce: casesHeard.some(selection => selection.areaOfLawType.name === 'Divorce' && selection.selected),
      };
    }
    return { Adoption: !!casesHeard.Adoption, Children: !!casesHeard.Children, Divorce: !!casesHeard.Divorce };
  }

  private buildCourtLocalAuthoritiesModelData(
    existingCourtLocalAuthorities: CourtLocalAuthoritiesList,
    casesHeard: CasesHeard
  ): LocalAuthoritySelections {
    const localAuthoritySelections: LocalAuthoritySelections = {};

    const filteredAolNames = localAuthorityAreas.filter(area => casesHeard[area]);

    for (const areaOfLaw of filteredAolNames) {
      const courtLocalAuthorities = existingCourtLocalAuthorities.find(
        ({ areaOfLawName }) => areaOfLawName === areaOfLaw
      );

      if (!courtLocalAuthorities) {
        continue;
      }

      const selections: LocalAuthoritySelection[] = courtLocalAuthorities.localAuthorities.map(
        ({ id, name, selected }) => ({
          id,
          name,
          selected,
        })
      );

      localAuthoritySelections[areaOfLaw] = {
        areaOfLawId: courtLocalAuthorities.areaOfLawId,
        localAuthorities: selections,
      };
    }

    return localAuthoritySelections;
  }
}
