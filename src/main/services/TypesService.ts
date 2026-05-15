import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { AreaOfLaw } from '../schemas/areaOfLawSchema';
import { CourtType } from '../schemas/courtTypeSchema';

const dataApiRequests = new DataApiRequests();

export class TypesService {
  public async listAreasOfLaw(): Promise<AreaOfLaw[] | HttpStatusCode> {
    return dataApiRequests.getAreasOfLaw();
  }

  public async listCourtTypes(): Promise<CourtType[] | HttpStatusCode> {
    return dataApiRequests.getCourtTypes();
  }
}
