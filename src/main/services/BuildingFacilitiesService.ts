import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { UpdateCourtFacilitiesRequest } from '../requests/types/UpdateCourtFacilitiesRequest';
import { BuildingFacilities } from '../schemas/buildingFacilitiesSchema';
import { validateBooleanField } from '../utils/validation';

export type FacilityModel = Partial<BuildingFacilities> & { errors?: Record<string, string[]> } & { name?: string };

export class BuildingFacilitiesService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(courtId: string): Promise<Partial<FacilityModel> | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }
    const courtFacility = await this.dataApiRequests.getBuildingFacilities(courtId);
    if (typeof courtFacility === 'number') {
      return courtFacility;
    }
    return { ...courtFacility, name: courtResponse.name };
  }
  public async save(courtId: string, model: FacilityModel): Promise<FacilityModel | HttpStatusCode> {
    // grab a fresh copy of the model (use the service as we want the regions)
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    // validate for errors
    const validationErrors = this.validate(model);
    if (validationErrors) {
      return { ...model, errors: validationErrors };
    }

    // persist to the API

    const result = await this.dataApiRequests.updateBuildingfacilities(courtId, <UpdateCourtFacilitiesRequest>model);
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
      return { ...model, errors, name: courtResponse.name };
    }

    // otherwise, it's a successful save
    return { ...result, name: courtResponse.name };
  }

  private validate(model: FacilityModel): Record<string, string[]> | undefined {
    const errors: Record<string, string[]> = {};
    const fields = [
      {
        key: 'parking',
        value: model.parking,
        message: 'Select whether the parking is available',
      },
      {
        key: 'waitingArea',
        value: model.waitingArea,
        message: 'Select whether the waiting area is available',
      },
      {
        key: 'quietRoom',
        value: model.quietRoom,
        message: 'Select whether the quiet room is available',
      },
      {
        key: 'babyChanging',
        value: model.babyChanging,
        message: 'Select whether the baby changing is available',
      },
      {
        key: 'wifi',
        value: model.wifi,
        message: 'Select whether the wifi is available',
      },
    ];

    fields.forEach(({ key, value, message }) => {
      const fieldErrors = validateBooleanField(value, message);
      if (fieldErrors) {
        errors[key] = fieldErrors;
      }
    });

    if (String(model.waitingArea) === 'true') {
      const childrenAreaErrors = validateBooleanField(
        model.waitingAreaChildren,
        'Select whether the children waiting area is available'
      );

      if (childrenAreaErrors) {
        errors.waitingAreaChildren = childrenAreaErrors;
      }
    }

    return Object.keys(errors).length > 0 ? errors : undefined;
  }
  private isHttpStatusCode(response: unknown): response is HttpStatusCode {
    return typeof response === 'number';
  }
}
