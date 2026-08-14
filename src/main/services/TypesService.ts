import { HttpStatusCode } from 'axios';

import { ReferenceDataApi } from '../requests/ReferenceDataApi';
import { AreaOfLawType } from '../schemas/areaOfLawSchema';
import { CourtType } from '../schemas/courtTypeSchema';
import { LocalAuthorityType } from '../schemas/localAuthorityTypeSchema';
import { OpeningHourType } from '../schemas/openingHoursSchema';

const referenceDataApi = new ReferenceDataApi();

// TODO: decide if we need this. it's currently just wrapping calls the the data api, which is only useful
//       if these things are needed outside of the service package.
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
