import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { AreaOfLawType } from '../schemas/areaOfLawSchema';
import { CourtType } from '../schemas/courtTypeSchema';
import { LocalAuthorityType } from '../schemas/localAuthorityTypeSchema';

const dataApiRequests = new DataApiRequests();

// TODO: decide if we need this. it's currently just wrapping calls the the data api, which is only useful
//       if these things are needed outside of the service package.
export class TypesService {
  public async listAreasOfLaw(): Promise<AreaOfLawType[] | HttpStatusCode> {
    return dataApiRequests.getAreasOfLaw();
  }

  public async listCourtTypes(): Promise<CourtType[] | HttpStatusCode> {
    return dataApiRequests.getCourtTypes();
  }

  public async listLocalAuthorities(): Promise<LocalAuthorityType[] | HttpStatusCode> {
    return dataApiRequests.getLocalAuthorities();
  }
}
