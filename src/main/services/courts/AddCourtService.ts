import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { ReferenceDataApi } from '../../requests/ReferenceDataApi';
import { ServiceCentreApi } from '../../requests/ServiceCentreApi';
import { Region } from '../../schemas/regionSchema';
import { isHttpStatusCode, toValidationErrorRecord } from '../../utils/apiResponses';
import { COURT_REGION_MESSAGE } from '../../utils/constants/messageConstants';
import { getCourtNameValidationErrors } from '../../utils/subjectNameValidation';
import { LocationNameService } from '../shared/LocationNameService';

type AddCourtForm = {
  name?: string;
  regionId?: string;
};

type AddCourtPageModel = AddCourtForm & {
  errors?: Record<string, string[]>;
  pagePath: string;
  pageTitle: string;
  regions: Region[];
};

type AddCourtResult =
  | AddCourtPageModel
  | {
      addressRedirectUrl: string;
      courtId: string;
      courtName: string;
      pagePath: string;
      pageTitle: string;
    }
  | HttpStatusCode;

export class AddCourtService {
  public constructor(
    private readonly courtApi = new CourtApi(),
    serviceCentreApi = new ServiceCentreApi(),
    private readonly referenceDataApi = new ReferenceDataApi(),
    private readonly locationNameService = new LocationNameService(courtApi, serviceCentreApi)
  ) {}

  /**
   * Builds the empty add-court page model, including regions for the mandatory dropdown.
   */
  public async getViewModel(form: AddCourtForm = {}): Promise<AddCourtPageModel | HttpStatusCode> {
    const regions = await this.referenceDataApi.getRegions();
    if (isHttpStatusCode(regions)) {
      return regions;
    }

    return {
      ...form,
      pagePath: '/add-court',
      pageTitle: 'Add new court',
      regions,
    };
  }

  /**
   * Applies the same name and region validation rules used by the general details page.
   */
  public validate(form: AddCourtForm): Record<string, string[]> | undefined {
    const errors: Record<string, string[]> = {};
    const nameErrors = getCourtNameValidationErrors(form.name);
    if (nameErrors.length > 0) {
      errors.name = nameErrors;
    }

    const regionErrors: string[] = [];
    if (!form.regionId || form.regionId.trim().length === 0) {
      regionErrors.push(COURT_REGION_MESSAGE);
    }
    if (regionErrors.length > 0) {
      errors.regionId = regionErrors;
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }

  /**
   * Validates the submitted form, checks for an existing court with the same exact name, then creates
   * a closed court ready for the user to add its first address.
   */
  public async create(form: AddCourtForm): Promise<AddCourtResult> {
    const trimmedForm = {
      ...form,
      name: form.name?.trim(),
    };
    const validationErrors = this.validate(trimmedForm);
    if (validationErrors) {
      return this.getViewModelWithErrors(trimmedForm, validationErrors);
    }

    const regions = await this.referenceDataApi.getRegions();
    if (isHttpStatusCode(regions)) {
      return regions;
    }

    const name = trimmedForm.name as string;
    const regionId = trimmedForm.regionId as string;
    const duplicateLocationStatus = await this.locationNameService.findDuplicate(name);
    if (duplicateLocationStatus !== HttpStatusCode.NotFound) {
      if (isHttpStatusCode(duplicateLocationStatus)) {
        return duplicateLocationStatus;
      }

      const duplicateLocationType = duplicateLocationStatus.type === 'serviceCentre' ? 'service centre' : 'court';
      return this.buildViewModelWithErrors(trimmedForm, regions, {
        name: [`A ${duplicateLocationType} with the entered name already exists: '${duplicateLocationStatus.name}'`],
      });
    }

    const createResponse = await this.courtApi.createCourt({
      name,
      open: false,
      regionId,
    });

    if (isHttpStatusCode(createResponse)) {
      return createResponse;
    }

    if (createResponse instanceof Map) {
      const errors = toValidationErrorRecord(createResponse);
      return this.buildViewModelWithErrors(trimmedForm, regions, errors);
    }

    return {
      addressRedirectUrl: `/courts/${createResponse.id}/edit/address`,
      courtId: createResponse.id,
      courtName: createResponse.name,
      pagePath: '/add-court/success',
      pageTitle: `New court created - ${createResponse.name}`,
    };
  }

  /**
   * Rebuilds the page model with validation errors while preserving the submitted values.
   */
  private async getViewModelWithErrors(
    form: AddCourtForm,
    errors: Record<string, string[]>
  ): Promise<AddCourtPageModel | HttpStatusCode> {
    const regions = await this.referenceDataApi.getRegions();
    if (isHttpStatusCode(regions)) {
      return regions;
    }

    return this.buildViewModelWithErrors(form, regions, errors);
  }

  /**
   * Creates the validation-error view model once regions have already been loaded.
   */
  private buildViewModelWithErrors(
    form: AddCourtForm,
    regions: Region[],
    errors: Record<string, string[]>
  ): AddCourtPageModel {
    return {
      ...form,
      errors,
      pagePath: '/add-court',
      pageTitle: 'Error: Add new court',
      regions,
    };
  }
}
