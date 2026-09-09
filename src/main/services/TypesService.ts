import { HttpStatusCode } from 'axios';

import { ReferenceDataApi } from '../requests/ReferenceDataApi';
import { AreaOfLawType } from '../schemas/areaOfLawSchema';
import { CourtType } from '../schemas/courtTypeSchema';
import { LocalAuthorityType } from '../schemas/localAuthorityTypeSchema';
import { OpeningHourType } from '../schemas/openingHoursSchema';

const referenceDataApi = new ReferenceDataApi();

export class TypesService {
  public async listAreasOfLaw(): Promise<AreaOfLawType[] | HttpStatusCode> {
    return referenceDataApi.getAreasOfLaw();
  }

  public async listCourtTypes(): Promise<CourtType[] | HttpStatusCode> {
    return referenceDataApi.getCourtTypes();
  }

  public async listOpeningHourTypes(): Promise<OpeningHourType[] | HttpStatusCode> {
    return referenceDataApi.getOpeningHourTypes();
  }

  public async listLocalAuthorities(): Promise<LocalAuthorityType[] | HttpStatusCode> {
    return referenceDataApi.getLocalAuthorities();
  }
}
