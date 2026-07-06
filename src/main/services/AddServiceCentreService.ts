import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { Region } from '../schemas/regionSchema';
import { ServiceArea } from '../schemas/serviceAreaSchema';

type AddServiceCentreForm = {
  name?: string;
  regionId?: string;
  serviceAreaIds?: string[];
};

type ServiceAreaCheckboxItem = {
  checked: boolean;
  text: string;
  value: string;
};

type AddServiceCentrePageModel = AddServiceCentreForm & {
  errors?: Record<string, string[]>;
  leftColumnServiceAreaItems: ServiceAreaCheckboxItem[];
  pagePath: string;
  pageTitle: string;
  regions: Region[];
  rightColumnServiceAreaItems: ServiceAreaCheckboxItem[];
  serviceAreas: ServiceArea[];
};

type AddServiceCentreSuccessModel = {
  addressRedirectUrl: string;
  pagePath: string;
  pageTitle: string;
  serviceCentreId: string;
  serviceCentreName: string;
};

type AddServiceCentreResult = AddServiceCentrePageModel | AddServiceCentreSuccessModel | HttpStatusCode;

const VALID_SERVICE_CENTRE_NAME_REGEX = /^[A-Za-z0-9'()\- ]+$/;

export class AddServiceCentreService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async getViewModel(form: AddServiceCentreForm = {}): Promise<AddServiceCentrePageModel | HttpStatusCode> {
    const modelData = await this.getModelData();
    if (typeof modelData === 'number') {
      return modelData;
    }

    return {
      ...form,
      ...this.buildServiceAreaColumns(modelData.serviceAreas, form.serviceAreaIds ?? []),
      pagePath: '/add-service-centre',
      pageTitle: 'Add new service centre',
      ...modelData,
    };
  }

  public validate(form: AddServiceCentreForm): Record<string, string[]> | undefined {
    const errors: Record<string, string[]> = {};
    const name = form.name?.trim();

    const nameErrors: string[] = [];
    if (!name || name.length === 0) {
      nameErrors.push('Enter a name for the service centre');
    } else if (name.length < 5 || name.length > 200) {
      nameErrors.push('Service centre name should be between 5 and 200 characters');
    }
    if (name && !VALID_SERVICE_CENTRE_NAME_REGEX.test(name)) {
      nameErrors.push(
        'Service centre name must only include letters, numbers, spaces, apostrophes, hyphens, and parentheses'
      );
    }
    if (nameErrors.length > 0) {
      errors.name = nameErrors;
    }

    if (!form.regionId || form.regionId.trim().length === 0) {
      errors.regionId = ['Select a region for the service centre'];
    }

    if (!form.serviceAreaIds || form.serviceAreaIds.length === 0) {
      errors.serviceAreaIds = ['Please specify the service areas of the service centre'];
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }

  public async create(form: AddServiceCentreForm): Promise<AddServiceCentreResult> {
    const trimmedForm = {
      ...form,
      name: form.name?.trim(),
      serviceAreaIds: form.serviceAreaIds ?? [],
    };
    const validationErrors = this.validate(trimmedForm);
    if (validationErrors) {
      return this.getViewModelWithErrors(trimmedForm, validationErrors);
    }

    const modelData = await this.getModelData();
    if (typeof modelData === 'number') {
      return modelData;
    }

    const name = trimmedForm.name as string;
    const regionId = trimmedForm.regionId as string;
    const duplicateLocationStatus = await this.checkDuplicateLocationName(name);
    if (duplicateLocationStatus !== HttpStatusCode.NotFound) {
      if (typeof duplicateLocationStatus === 'number') {
        return duplicateLocationStatus;
      }

      return this.buildViewModelWithErrors(trimmedForm, modelData.regions, modelData.serviceAreas, {
        name: [`A court or service centre already exists with the name: ${name}`],
      });
    }

    const createResponse = await this.dataApiRequests.createServiceCentre({
      name,
      open: false,
      regionId,
      serviceAreaIds: trimmedForm.serviceAreaIds,
    });

    if (typeof createResponse === 'number') {
      return createResponse;
    }

    if (createResponse instanceof Map) {
      const errors: Record<string, string[]> = {};
      for (const [key, value] of createResponse) {
        if (key === 'timestamp') {
          continue;
        }
        errors[key] = [value];
      }
      return this.buildViewModelWithErrors(trimmedForm, modelData.regions, modelData.serviceAreas, errors);
    }

    return {
      addressRedirectUrl: `/service-centres/${createResponse.id}/edit/address`,
      pagePath: '/add-service-centre/success',
      pageTitle: `New service centre created - ${createResponse.name}`,
      serviceCentreId: createResponse.id,
      serviceCentreName: createResponse.name,
    };
  }

  private async checkDuplicateLocationName(
    name: string
  ): Promise<{ name: string } | HttpStatusCode.NotFound | HttpStatusCode> {
    const duplicateCourt = await this.dataApiRequests.getCourtByName(name);
    if (typeof duplicateCourt !== 'number') {
      return { name: duplicateCourt.name };
    }
    if (duplicateCourt !== HttpStatusCode.NotFound) {
      return duplicateCourt;
    }

    const duplicateServiceCentre = await this.dataApiRequests.getServiceCentreByName(name);
    if (typeof duplicateServiceCentre !== 'number') {
      return { name: duplicateServiceCentre.name };
    }

    return duplicateServiceCentre;
  }

  private async getViewModelWithErrors(
    form: AddServiceCentreForm,
    errors: Record<string, string[]>
  ): Promise<AddServiceCentrePageModel | HttpStatusCode> {
    const modelData = await this.getModelData();
    if (typeof modelData === 'number') {
      return modelData;
    }

    return this.buildViewModelWithErrors(form, modelData.regions, modelData.serviceAreas, errors);
  }

  private async getModelData(): Promise<{ regions: Region[]; serviceAreas: ServiceArea[] } | HttpStatusCode> {
    const regions = await this.dataApiRequests.getRegions();
    if (typeof regions === 'number') {
      return regions;
    }

    const serviceAreas = await this.dataApiRequests.getServiceAreas();
    if (typeof serviceAreas === 'number') {
      return serviceAreas;
    }

    return { regions, serviceAreas };
  }

  private buildViewModelWithErrors(
    form: AddServiceCentreForm,
    regions: Region[],
    serviceAreas: ServiceArea[],
    errors: Record<string, string[]>
  ): AddServiceCentrePageModel {
    return {
      ...form,
      errors,
      ...this.buildServiceAreaColumns(serviceAreas, form.serviceAreaIds ?? []),
      pagePath: '/add-service-centre',
      pageTitle: 'Error: Add new service centre',
      regions,
      serviceAreas,
    };
  }

  private buildServiceAreaColumns(
    serviceAreas: ServiceArea[],
    selectedServiceAreaIds: string[]
  ): {
    leftColumnServiceAreaItems: ServiceAreaCheckboxItem[];
    rightColumnServiceAreaItems: ServiceAreaCheckboxItem[];
  } {
    const selectedServiceAreaIdSet = new Set(selectedServiceAreaIds);
    const serviceAreaItems = serviceAreas
      .map(serviceArea => ({
        checked: selectedServiceAreaIdSet.has(serviceArea.id),
        text: serviceArea.name,
        value: serviceArea.id,
      }))
      .sort((left, right) => left.text.localeCompare(right.text));
    const midpoint = Math.ceil(serviceAreaItems.length / 2);

    return {
      leftColumnServiceAreaItems: serviceAreaItems.slice(0, midpoint),
      rightColumnServiceAreaItems: serviceAreaItems.slice(midpoint),
    };
  }
}
