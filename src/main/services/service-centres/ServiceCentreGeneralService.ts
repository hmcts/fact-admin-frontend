import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { ReferenceDataApi } from '../../requests/ReferenceDataApi';
import { ServiceCentreApi } from '../../requests/ServiceCentreApi';
import { Region } from '../../schemas/regionSchema';
import { ServiceArea } from '../../schemas/serviceAreaSchema';
import { ServiceCentre } from '../../schemas/serviceCentreSchema';
import { isHttpStatusCode, toValidationErrorRecord } from '../../utils/apiResponses';
import {
  SERVICE_CENTRE_OPEN_MESSAGE,
  SERVICE_CENTRE_REGION_INVALID_MESSAGE,
  SERVICE_CENTRE_SERVICE_AREA_MESSAGE,
} from '../../utils/constants/messageConstants';
import { sortAndSplitIntoColumns } from '../../utils/formHelpers';
import { getServiceCentreNameValidationErrors } from '../../utils/subjectNameValidation';
import { LocationNameService } from '../shared/LocationNameService';

type ServiceAreaCheckboxItem = {
  checked: boolean;
  text: string;
  value: string;
};

export type ServiceCentreGeneralViewModel = {
  errors?: Record<string, string[]>;
  id: string;
  leftColumnServiceAreaItems: ServiceAreaCheckboxItem[];
  name?: string;
  open?: boolean;
  pageTitle: string;
  rightColumnServiceAreaItems: ServiceAreaCheckboxItem[];
  serviceAreaIds?: string[];
  regions: Region[];
  regionId?: string;
};

export type ServiceCentreGeneralSaveResult =
  | {
      type: 'saved';
      viewModel: ServiceCentreGeneralViewModel;
    }
  | {
      type: 'validation-error';
      viewModel: ServiceCentreGeneralViewModel;
    }
  | {
      status: HttpStatusCode;
      type: 'status';
    };

export class ServiceCentreGeneralService {
  public constructor(
    courtApi = new CourtApi(),
    private readonly serviceCentreApi = new ServiceCentreApi(),
    private readonly referenceDataApi = new ReferenceDataApi(),
    private readonly locationNameService = new LocationNameService(courtApi, serviceCentreApi)
  ) {}

  public async retrieve(serviceCentreId: string): Promise<ServiceCentreGeneralViewModel | HttpStatusCode> {
    const serviceCentreResponse = await this.serviceCentreApi.getServiceCentreById(serviceCentreId);
    if (isHttpStatusCode(serviceCentreResponse)) {
      return serviceCentreResponse;
    }

    const serviceAreasResponse = await this.referenceDataApi.getServiceAreas();
    if (isHttpStatusCode(serviceAreasResponse)) {
      return serviceAreasResponse;
    }

    const regions = await this.referenceDataApi.getRegions();
    if (isHttpStatusCode(regions)) {
      return regions;
    }

    return this.toViewModel(serviceCentreResponse, serviceAreasResponse, regions);
  }

  public async save(model: {
    id: string;
    name?: string;
    open?: boolean;
    serviceAreaIds?: string[];
    regionId?: string;
  }): Promise<ServiceCentreGeneralSaveResult> {
    const existingServiceCentre = await this.serviceCentreApi.getServiceCentreById(model.id);
    if (isHttpStatusCode(existingServiceCentre)) {
      return { status: existingServiceCentre, type: 'status' };
    }

    const serviceAreasResponse = await this.referenceDataApi.getServiceAreas();
    if (isHttpStatusCode(serviceAreasResponse)) {
      return { status: serviceAreasResponse, type: 'status' };
    }

    const regions = await this.referenceDataApi.getRegions();
    if (isHttpStatusCode(regions)) {
      return { status: regions, type: 'status' };
    }

    const trimmedName = model.name?.trim();
    const updatedServiceCentre: ServiceCentre = {
      ...existingServiceCentre,
      name: trimmedName ?? '',
      open: model.open ?? existingServiceCentre.open,
      serviceAreaIds: model.serviceAreaIds ?? [],
      regionId: model.regionId ?? existingServiceCentre.regionId,
    };

    const validationErrors = this.validate({
      name: trimmedName,
      open: model.open,
      serviceAreaIds: model.serviceAreaIds,
      regionIds: regions.map(region => region.id),
      regionId: model.regionId ?? existingServiceCentre.regionId ?? '',
    });
    if (validationErrors) {
      return {
        type: 'validation-error',
        viewModel: this.toViewModel(updatedServiceCentre, serviceAreasResponse, regions, validationErrors),
      };
    }

    const duplicateLocationResult = await this.locationNameService.findDuplicate(updatedServiceCentre.name, {
      id: updatedServiceCentre.id,
      type: 'serviceCentre',
    });
    if (isHttpStatusCode(duplicateLocationResult)) {
      if (duplicateLocationResult !== HttpStatusCode.NotFound) {
        return { status: duplicateLocationResult, type: 'status' };
      }
    } else {
      return {
        type: 'validation-error',
        viewModel: this.toViewModel(updatedServiceCentre, serviceAreasResponse, regions, {
          name: [
            `A ${duplicateLocationResult.type === 'serviceCentre' ? 'service centre' : 'court'} with the entered name already exists: '${duplicateLocationResult.name}'`,
          ],
        }),
      };
    }

    const updateResponse = await this.serviceCentreApi.updateServiceCentre(updatedServiceCentre);
    if (isHttpStatusCode(updateResponse)) {
      return { status: updateResponse, type: 'status' };
    }

    if (updateResponse instanceof Map) {
      const errors = toValidationErrorRecord(updateResponse);

      return {
        type: 'validation-error',
        viewModel: this.toViewModel(updatedServiceCentre, serviceAreasResponse, regions, errors),
      };
    }

    return {
      type: 'saved',
      viewModel: this.toViewModel(updateResponse, serviceAreasResponse, regions),
    };
  }

  private toViewModel(
    serviceCentre: Pick<ServiceCentre, 'id' | 'name' | 'open' | 'serviceAreaIds' | 'regionId'>,
    serviceAreas: ServiceArea[],
    regions: Region[],
    errors?: Record<string, string[]>
  ): ServiceCentreGeneralViewModel {
    const selectedServiceAreaIds = serviceCentre.serviceAreaIds ?? [];
    const selectedIds = new Set(selectedServiceAreaIds);
    const items = serviceAreas.map(serviceArea => ({
      checked: selectedIds.has(serviceArea.id),
      text: serviceArea.name,
      value: serviceArea.id,
    }));
    const columns = sortAndSplitIntoColumns(items, item => item.text);

    return {
      errors,
      id: serviceCentre.id,
      leftColumnServiceAreaItems: columns.left,
      name: serviceCentre.name,
      open: serviceCentre.open,
      pageTitle: errors ? `Error: General - ${serviceCentre.name}` : `General - ${serviceCentre.name}`,
      rightColumnServiceAreaItems: columns.right,
      serviceAreaIds: selectedServiceAreaIds,
      regions,
      regionId: serviceCentre.regionId ?? undefined,
    };
  }

  private validate(model: {
    name?: string;
    open?: boolean;
    serviceAreaIds?: string[];
    regionIds: string[];
    regionId: string;
  }): Record<string, string[]> | undefined {
    const errors: Record<string, string[]> = {};

    const nameErrors = getServiceCentreNameValidationErrors(model.name);
    if (nameErrors.length > 0) {
      errors.name = nameErrors;
    }

    if (model.open === undefined || model.open === null) {
      errors.open = [SERVICE_CENTRE_OPEN_MESSAGE];
    }

    if (!model.serviceAreaIds || model.serviceAreaIds.length === 0) {
      errors.serviceAreaIds = [SERVICE_CENTRE_SERVICE_AREA_MESSAGE];
    }

    if (!model.regionId || model.regionId.length === 0 || !model.regionIds.includes(model.regionId)) {
      errors.regionId = [SERVICE_CENTRE_REGION_INVALID_MESSAGE];
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }
}
