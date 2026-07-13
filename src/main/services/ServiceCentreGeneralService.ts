import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { ServiceArea } from '../schemas/serviceAreaSchema';
import { ServiceCentre } from '../schemas/serviceCentreSchema';

const VALID_SERVICE_CENTRE_NAME_REGEX = /^[A-Za-z0-9'()\- ]+$/;

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
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(serviceCentreId: string): Promise<ServiceCentreGeneralViewModel | HttpStatusCode> {
    const serviceCentreResponse = await this.dataApiRequests.getServiceCentreById(serviceCentreId);
    if (typeof serviceCentreResponse === 'number') {
      return serviceCentreResponse;
    }

    const serviceAreasResponse = await this.dataApiRequests.getServiceAreas();
    if (typeof serviceAreasResponse === 'number') {
      return serviceAreasResponse;
    }

    return this.toViewModel(serviceCentreResponse, serviceAreasResponse);
  }

  public async save(model: {
    id: string;
    name?: string;
    open?: boolean;
    serviceAreaIds?: string[];
  }): Promise<ServiceCentreGeneralSaveResult> {
    const existingServiceCentre = await this.dataApiRequests.getServiceCentreById(model.id);
    if (typeof existingServiceCentre === 'number') {
      return { status: existingServiceCentre, type: 'status' };
    }

    const serviceAreasResponse = await this.dataApiRequests.getServiceAreas();
    if (typeof serviceAreasResponse === 'number') {
      return { status: serviceAreasResponse, type: 'status' };
    }

    const trimmedName = model.name?.trim();
    const updatedServiceCentre: ServiceCentre = {
      ...existingServiceCentre,
      name: trimmedName ?? '',
      open: model.open ?? existingServiceCentre.open,
      serviceAreaIds: model.serviceAreaIds ?? [],
    };

    const validationErrors = this.validate({
      name: trimmedName,
      open: model.open,
      serviceAreaIds: model.serviceAreaIds,
    });
    if (validationErrors) {
      return {
        type: 'validation-error',
        viewModel: this.toViewModel(updatedServiceCentre, serviceAreasResponse, validationErrors),
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
        viewModel: this.toViewModel(updatedServiceCentre, serviceAreasResponse, {
          name: [
            `A ${duplicateLocationResult.type} with the entered name already exists: '${duplicateLocationResult.name}'`,
          ],
        }),
      };
    }

    const updateResponse = await this.dataApiRequests.updateServiceCentre(updatedServiceCentre);
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
        viewModel: this.toViewModel(updatedServiceCentre, serviceAreasResponse, errors),
      };
    }

    return {
      type: 'saved',
      viewModel: this.toViewModel(updateResponse, serviceAreasResponse),
    };
  }

  private async checkDuplicateLocationName(
    name: string,
    serviceCentreId: string
  ): Promise<{ name: string; type: 'court' | 'service centre' } | HttpStatusCode.NotFound | HttpStatusCode> {
    const duplicateCourt = await this.dataApiRequests.getCourtByName(name);
    if (typeof duplicateCourt !== 'number') {
      return { name: duplicateCourt.name, type: 'court' };
    }
    if (duplicateCourt !== HttpStatusCode.NotFound) {
      return duplicateCourt;
    }

    const duplicateServiceCentre = await this.dataApiRequests.getServiceCentreByName(name);
    if (typeof duplicateServiceCentre !== 'number') {
      if (duplicateServiceCentre.id !== serviceCentreId) {
        return { name: duplicateServiceCentre.name, type: 'service centre' };
      }
      return HttpStatusCode.NotFound;
    }

    return duplicateServiceCentre;
  }

  private toViewModel(
    serviceCentre: Pick<ServiceCentre, 'id' | 'name' | 'open' | 'serviceAreaIds'>,
    serviceAreas: ServiceArea[],
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
    };
  }

  private validate(model: {
    name?: string;
    open?: boolean;
    serviceAreaIds?: string[];
  }): Record<string, string[]> | undefined {
    const errors: Record<string, string[]> = {};

    const nameErrors: string[] = [];
    if (!model.name || model.name.trim().length === 0) {
      nameErrors.push('Enter a name for the service centre');
    } else if (model.name.length < 5 || model.name.length > 200) {
      nameErrors.push('Service centre name should be between 5 and 200 characters');
    }
    if (model.name && !VALID_SERVICE_CENTRE_NAME_REGEX.test(model.name)) {
      nameErrors.push(
        'Service centre name must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses'
      );
    }
    if (nameErrors.length > 0) {
      errors.name = nameErrors;
    }

    if (model.open === undefined || model.open === null) {
      errors.open = ['Select whether the service centre is open or closed'];
    }

    if (!model.serviceAreaIds || model.serviceAreaIds.length === 0) {
      errors.serviceAreaIds = ['Please specify the service areas of the service centre'];
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }
}
