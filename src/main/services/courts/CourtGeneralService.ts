import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { ReferenceDataApi } from '../../requests/ReferenceDataApi';
import { ServiceCentreApi } from '../../requests/ServiceCentreApi';
import { CourtEntity } from '../../schemas/courtEntitySchema';
import { Region } from '../../schemas/regionSchema';
import { isHttpStatusCode, toValidationErrorRecord } from '../../utils/apiResponses';
import {
  COURT_ALREADY_EXISTS_MESSAGE,
  COURT_OPEN_MESSAGE,
  COURT_REGION_MESSAGE,
} from '../../utils/constants/messageConstants';
import { getCourtNameValidationErrors } from '../../utils/subjectNameValidation';
import { LocationNameService } from '../shared/LocationNameService';

export type GeneralViewModel = Partial<CourtEntity> & {
  errors?: Record<string, string[]>;
  originalName?: string;
  regions?: Region[];
};

export class CourtGeneralService {
  public constructor(
    private readonly courtApi = new CourtApi(),
    private readonly referenceDataApi = new ReferenceDataApi(),
    private readonly locationNameService = new LocationNameService(courtApi, new ServiceCentreApi())
  ) {}

  public async retrieve(courtId: string): Promise<GeneralViewModel | HttpStatusCode> {
    const courtEntity = await this.courtApi.getCourtById(courtId);
    if (isHttpStatusCode(courtEntity)) {
      return courtEntity;
    }

    const regions = await this.referenceDataApi.getRegions();
    if (isHttpStatusCode(regions)) {
      return regions;
    }

    return { ...courtEntity, regions };
  }

  public async save(model: GeneralViewModel): Promise<GeneralViewModel | HttpStatusCode> {
    // grab a fresh copy of the model (use the service as we want the regions)
    const courtEntity = await this.retrieve(model.id as string);
    if (isHttpStatusCode(courtEntity)) {
      return courtEntity;
    }
    const originalName = courtEntity.name;
    const trimmedName = model.name?.trim();

    // overlay our specific changes
    courtEntity.name = trimmedName as string;
    courtEntity.regionId = model.regionId as string;
    courtEntity.open = model.open as boolean;
    const trimmedModel = {
      ...model,
      name: trimmedName,
    };

    // validate for obvious errors
    const validationErrors = this.validateCourtEntity(trimmedModel);
    if (validationErrors) {
      return { ...courtEntity, errors: validationErrors, originalName };
    }

    // ensure that if we already have a court with this exact name, that it's this court
    const duplicateCourt = await this.locationNameService.findDuplicate(trimmedName as string, {
      id: courtEntity.id as string,
      type: 'court',
    });
    if (isHttpStatusCode(duplicateCourt)) {
      if (duplicateCourt !== HttpStatusCode.NotFound) {
        return duplicateCourt;
      }
    } else if (duplicateCourt.id !== courtEntity.id) {
      return {
        ...courtEntity,
        errors: {
          name: [`${COURT_ALREADY_EXISTS_MESSAGE}: '${duplicateCourt.name}'`],
        },
      };
    }

    // persist to the API
    const result = await this.courtApi.updateCourt(courtEntity as CourtEntity);
    if (isHttpStatusCode(result)) {
      return result;
    }

    // if it's a Map, it's [validation] errors from the API
    if (result instanceof Map) {
      const errors = toValidationErrorRecord(result);
      return { ...courtEntity, errors };
    }

    // otherwise, it's a successful save
    return result;
  }

  private validateCourtEntity(model: GeneralViewModel): Record<string, string[]> | undefined {
    const errors: Record<string, string[]> = {};
    const nameErrors = getCourtNameValidationErrors(model.name);
    if (nameErrors.length > 0) {
      errors.name = nameErrors;
    }

    // region just has to be selected
    const regionErrors: string[] = [];
    if (!model.regionId || model.regionId.trim().length === 0) {
      regionErrors.push(COURT_REGION_MESSAGE);
    }
    if (regionErrors.length > 0) {
      errors.regionId = regionErrors;
    }

    // in case someone manages to post without open being set to true or false, we should catch that too
    const openErrors: string[] = [];
    if (model.open === undefined || model.open === null) {
      openErrors.push(COURT_OPEN_MESSAGE);
    }
    if (openErrors.length > 0) {
      errors.open = openErrors;
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }
}
