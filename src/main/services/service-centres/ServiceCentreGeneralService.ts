import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { ReferenceDataApi } from '../../requests/ReferenceDataApi';
import { ServiceCentreApi } from '../../requests/ServiceCentreApi';
import { Region } from '../../schemas/regionSchema';
import { ServiceArea } from '../../schemas/serviceAreaSchema';
import { ServiceCentre } from '../../schemas/serviceCentreSchema';
import {
  SERVICE_CENTRE_NAME_LENGTH_ERROR,
  SERVICE_CENTRE_NAME_MAX_LENGTH,
  SERVICE_CENTRE_NAME_MESSAGE,
  SERVICE_CENTRE_NAME_MIN_LENGTH,
  SERVICE_CENTRE_OPEN_MESSAGE,
  SERVICE_CENTRE_REGION_MESSAGE,
  SERVICE_CENTRE_SERVICE_AREA_MESSAGE,
  VALID_SERVICE_CENTRE_NAME_REGEX,
  VALID_SERVICE_CENTRE_NAME_REGEX_MESSAGE,
} from '../../utils/variablesConstants';

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
    private readonly courtApi = new CourtApi(),
    private readonly serviceCentreApi = new ServiceCentreApi(),
    private readonly referenceDataApi = new ReferenceDataApi()
  ) {}

  public async retrieve(serviceCentreId: string): Promise<ServiceCentreGeneralViewModel | HttpStatusCode> {
    const serviceCentreResponse = await this.serviceCentreApi.getServiceCentreById(serviceCentreId);
    if (typeof serviceCentreResponse === 'number') {
      return serviceCentreResponse;
    }

    const serviceAreasResponse = await this.referenceDataApi.getServiceAreas();
    if (typeof serviceAreasResponse === 'number') {
      return serviceAreasResponse;
    }

    const regions = await this.referenceDataApi.getRegions();
    if (typeof regions === 'number') {
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
    if (typeof existingServiceCentre === 'number') {
      return { status: existingServiceCentre, type: 'status' };
    }

    const serviceAreasResponse = await this.referenceDataApi.getServiceAreas();
    if (typeof serviceAreasResponse === 'number') {
      return { status: serviceAreasResponse, type: 'status' };
    }

    const regions = await this.referenceDataApi.getRegions();
    if (typeof regions === 'number') {
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

    const duplicateLocationResult = await this.checkDuplicateLocationName(
      updatedServiceCentre.name,
      updatedServiceCentre.id
    );
    if (typeof duplicateLocationResult === 'number') {
      if (duplicateLocationResult !== HttpStatusCode.NotFound) {
        return { status: duplicateLocationResult, type: 'status' };
      }
    } else {
      return {
        type: 'validation-error',
        viewModel: this.toViewModel(updatedServiceCentre, serviceAreasResponse, regions, {
          name: [
            `A ${duplicateLocationResult.type} with the entered name already exists: '${duplicateLocationResult.name}'`,
          ],
        }),
      };
    }

    const updateResponse = await this.serviceCentreApi.updateServiceCentre(updatedServiceCentre);
    if (typeof updateResponse === 'number') {
      return { status: updateResponse, type: 'status' };
    }

    if (updateResponse instanceof Map) {
      const errors: Record<string, string[]> = {};
      for (const [key, value] of updateResponse) {
        if (key === 'timestamp') {
          continue;
        }
        errors[key] = [value];
      }

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

  private async checkDuplicateLocationName(
    name: string,
    serviceCentreId: string
  ): Promise<{ name: string; type: 'court' | 'service centre' } | HttpStatusCode.NotFound | HttpStatusCode> {
    const duplicateCourt = await this.courtApi.getCourtByName(name);
    if (typeof duplicateCourt !== 'number') {
      return { name: duplicateCourt.name, type: 'court' };
    }
    if (duplicateCourt !== HttpStatusCode.NotFound) {
      return duplicateCourt;
    }

    const duplicateServiceCentre = await this.serviceCentreApi.getServiceCentreByName(name);
    if (typeof duplicateServiceCentre !== 'number') {
      if (duplicateServiceCentre.id !== serviceCentreId) {
        return { name: duplicateServiceCentre.name, type: 'service centre' };
      }
      return HttpStatusCode.NotFound;
    }

    return duplicateServiceCentre;
  }

  private toViewModel(
    serviceCentre: Pick<ServiceCentre, 'id' | 'name' | 'open' | 'serviceAreaIds' | 'regionId'>,
    serviceAreas: ServiceArea[],
    regions: Region[],
    errors?: Record<string, string[]>
  ): ServiceCentreGeneralViewModel {
    const selectedServiceAreaIds = serviceCentre.serviceAreaIds ?? [];
    const selectedIds = new Set(selectedServiceAreaIds);
    const items = serviceAreas
      .map(serviceArea => ({
        checked: selectedIds.has(serviceArea.id),
        text: serviceArea.name,
        value: serviceArea.id,
      }))
      .sort((left, right) => left.text.localeCompare(right.text));
    const midpoint = Math.ceil(items.length / 2);

    return {
      errors,
      id: serviceCentre.id,
      leftColumnServiceAreaItems: items.slice(0, midpoint),
      name: serviceCentre.name,
      open: serviceCentre.open,
      pageTitle: errors ? `Error: General - ${serviceCentre.name}` : `General - ${serviceCentre.name}`,
      rightColumnServiceAreaItems: items.slice(midpoint),
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

    const nameErrors: string[] = [];
    if (!model.name || model.name.trim().length === 0) {
      nameErrors.push(SERVICE_CENTRE_NAME_MESSAGE);
    } else if (
      model.name.length < SERVICE_CENTRE_NAME_MIN_LENGTH ||
      model.name.length > SERVICE_CENTRE_NAME_MAX_LENGTH
    ) {
      nameErrors.push(SERVICE_CENTRE_NAME_LENGTH_ERROR);
    }
    if (model.name && !VALID_SERVICE_CENTRE_NAME_REGEX.test(model.name)) {
      nameErrors.push(VALID_SERVICE_CENTRE_NAME_REGEX_MESSAGE);
    }
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
      errors.regionId = [SERVICE_CENTRE_REGION_MESSAGE];
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }
}
