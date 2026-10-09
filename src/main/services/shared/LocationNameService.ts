import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { ServiceCentreApi } from '../../requests/ServiceCentreApi';
import { isHttpStatusCode } from '../../utils/apiResponses';

export type LocationType = 'court' | 'serviceCentre';

export type DuplicateLocation = {
  id: string;
  name: string;
  type: LocationType;
};

export type LocationExclusion = {
  id: string;
  type: LocationType;
};

export class LocationNameService {
  public constructor(
    private readonly courtApi = new CourtApi(),
    private readonly serviceCentreApi = new ServiceCentreApi()
  ) {}

  public async findDuplicate(name: string, exclusion?: LocationExclusion): Promise<DuplicateLocation | HttpStatusCode> {
    const court = await this.courtApi.getCourtByName(name);
    if (!isHttpStatusCode(court)) {
      if (exclusion?.type !== 'court' || exclusion.id !== court.id) {
        return { id: court.id, name: court.name, type: 'court' };
      }
    } else if (court !== HttpStatusCode.NotFound) {
      return court;
    }

    const serviceCentre = await this.serviceCentreApi.getServiceCentreByName(name);
    if (!isHttpStatusCode(serviceCentre)) {
      if (exclusion?.type !== 'serviceCentre' || exclusion.id !== serviceCentre.id) {
        return { id: serviceCentre.id, name: serviceCentre.name, type: 'serviceCentre' };
      }
      return HttpStatusCode.NotFound;
    }

    return serviceCentre;
  }
}
