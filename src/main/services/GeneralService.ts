import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { CourtEntity } from '../schemas/courtEntitySchema';
import { Region } from '../schemas/regionSchema';
import { toSlugFormat } from '../utils/valueParsers';

export type GeneralViewModel = Partial<CourtEntity> & { errors?: Record<string, string[]>; regions?: Region[] };

const VALID_COURT_NAME_REGEX = /^[A-Z&'()\- ]+$/i;

export class GeneralService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(courtId: string): Promise<GeneralViewModel | HttpStatusCode> {
    const courtEntity = await this.dataApiRequests.getCourtById(courtId);
    if (typeof courtEntity === 'number') {
      return courtEntity;
    }

    const regions = await this.dataApiRequests.getRegions();
    if (typeof regions === 'number') {
      return regions;
    }

    return { ...courtEntity, regions };
  }

  public async save(model: GeneralViewModel): Promise<GeneralViewModel | HttpStatusCode> {
    // grab a fresh copy of the model (use the service as we want the regions)
    const courtEntity = await this.retrieve(model.id as string);
    if (typeof courtEntity === 'number') {
      return courtEntity;
    }

    // overlay our specific changes
    courtEntity.name = model.name as string;
    courtEntity.regionId = model.regionId as string;
    courtEntity.open = model.open as boolean;

    // validate for obvious errors
    const validationErrors = this.validateCourtEntity(model);
    if (validationErrors) {
      return { ...courtEntity, errors: validationErrors };
    }

    // ensure that if we already have a court with this slug, that it's this court
    const duplicateCourt = await this.dataApiRequests.getCourtBySlug(toSlugFormat(courtEntity.name));
    if (typeof duplicateCourt === 'number') {
      if (duplicateCourt !== HttpStatusCode.NotFound) {
        return duplicateCourt;
      }
    } else if (duplicateCourt.id !== courtEntity.id) {
      return {
        ...courtEntity,
        errors: {
          name: [`A court with the entered name already exists: '${duplicateCourt.name}'`],
        },
      };
    }

    // persist to the API
    const result = await this.dataApiRequests.updateCourt(courtEntity as CourtEntity);
    if (typeof result === 'number') {
      return result;
    }

    // if it's a Map, it's [validation ]errors from the API
    if (result instanceof Map) {
      // convert the mapped errors into our expected error format
      const errors: Record<string, string[]> = {};
      for (const [key, value] of result) {
        errors[key] = [value];
      }
      return { ...courtEntity, errors };
    }

    // otherwise, it's a successful save
    return result;
  }

  private validateCourtEntity(model: GeneralViewModel): Record<string, string[]> | undefined {
    const errors: Record<string, string[]> = {};

    const nameErrors: string[] = [];
    // Make sure we have a name and that it's within length limits
    if (!model.name || model.name.trim().length === 0) {
      nameErrors.push('Enter a name for the court');
    } else if (model.name.length < 5 || model.name.length > 200) {
      nameErrors.push('Court name should be between 5 and 200 chars');
    }
    // if it's been specified, regardless of other errors, ensure it's content is valid
    if (model.name && !VALID_COURT_NAME_REGEX.test(model.name)) {
      nameErrors.push(
        'Court name must only include letters, spaces, apostrophes, hyphens, ampersands, and parentheses'
      );
    }
    if (nameErrors.length > 0) {
      errors.name = nameErrors;
    }

    // region just has to be selected
    const regionErrors: string[] = [];
    if (!model.regionId || model.regionId.trim().length === 0) {
      regionErrors.push('Select a region for the court');
    }
    if (regionErrors.length > 0) {
      errors.regionId = regionErrors;
    }

    // in case someone manages to post without open being set to true or false, we should catch that too
    const openErrors: string[] = [];
    if (model.open === undefined || model.open === null) {
      openErrors.push('Select whether the court is open or closed');
    }
    if (openErrors.length > 0) {
      errors.open = openErrors;
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }
}
