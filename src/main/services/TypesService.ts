import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { AreaOfLawType } from '../schemas/areaOfLawSchema';
import { CourtType } from '../schemas/courtTypeSchema';

const dataApiRequests = new DataApiRequests();

export class TypesService {
  public async listAreasOfLaw(): Promise<AreaOfLawType[] | HttpStatusCode> {
    return dataApiRequests.getAreasOfLaw();
  }

  public async listCourtTypes(): Promise<CourtType[] | HttpStatusCode> {
    return dataApiRequests.getCourtTypes();
  }
}
