import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { Region } from '../schemas/regionSchema';

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

const VALID_COURT_NAME_REGEX = /^[A-Z&'()\- ]+$/i;

export class AddCourtService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  /**
   * Builds the empty add-court page model, including regions for the mandatory dropdown.
   */
  public async getViewModel(form: AddCourtForm = {}): Promise<AddCourtPageModel | HttpStatusCode> {
    const regions = await this.dataApiRequests.getRegions();
    if (typeof regions === 'number') {
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

    const nameErrors: string[] = [];
    if (!form.name || form.name.trim().length === 0) {
      nameErrors.push('Enter a name for the court');
    } else if (form.name.length < 5 || form.name.length > 200) {
      nameErrors.push('Court name should be between 5 and 200 characters');
    }
    if (form.name && !VALID_COURT_NAME_REGEX.test(form.name)) {
      nameErrors.push(
        'Court name must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses'
      );
    }
    if (nameErrors.length > 0) {
      errors.name = nameErrors;
    }

    const regionErrors: string[] = [];
    if (!form.regionId || form.regionId.trim().length === 0) {
      regionErrors.push('Select a region for the court');
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
    const validationErrors = this.validate(form);
    if (validationErrors) {
      return this.getViewModelWithErrors(form, validationErrors);
    }

    const regions = await this.dataApiRequests.getRegions();
    if (typeof regions === 'number') {
      return regions;
    }

    const name = form.name as string;
    const regionId = form.regionId as string;
    const duplicateCourt = await this.dataApiRequests.getCourtByName(name);
    if (typeof duplicateCourt === 'number') {
      if (duplicateCourt !== HttpStatusCode.NotFound) {
        return duplicateCourt;
      }
    } else {
      return this.buildViewModelWithErrors(form, regions, {
        name: [`A court with the entered name already exists: '${duplicateCourt.name}'`],
      });
    }

    const createResponse = await this.dataApiRequests.createCourt({
      isServiceCentre: false,
      name,
      open: false,
      regionId,
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
      return this.buildViewModelWithErrors(form, regions, errors);
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
    const regions = await this.dataApiRequests.getRegions();
    if (typeof regions === 'number') {
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
