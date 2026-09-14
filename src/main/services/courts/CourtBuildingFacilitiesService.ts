import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { UpdateBuildingFacilitiesRequest } from '../../requests/types/UpdateBuildingFacilitiesRequest';
import { BuildingFacilities } from '../../schemas/buildingFacilitiesSchema';
import { validateBooleanField } from '../../utils/validation';
import {
  COURT_BUILDING_FACILITIES_BABY_CHANGING_REQUIRED_MESSAGE,
  COURT_BUILDING_FACILITIES_PARKING_REQUIRED_MESSAGE,
  COURT_BUILDING_FACILITIES_QUIET_ROOM_REQUIRED_MESSAGE,
  COURT_BUILDING_FACILITIES_WAITING_AREA_CHILDREN_REQUIRED_MESSAGE,
  COURT_BUILDING_FACILITIES_WAITING_AREA_REQUIRED_MESSAGE,
  COURT_BUILDING_FACILITIES_WIFI_REQUIRED_MESSAGE,
} from '../../utils/variablesConstants';

export type FacilityModel = Partial<BuildingFacilities> & { errors?: Record<string, string[]> } & { name?: string };

export class CourtBuildingFacilitiesService {
  public constructor(private readonly courtApi = new CourtApi()) {}

  public async retrieve(courtId: string): Promise<Partial<FacilityModel> | HttpStatusCode> {
    const courtResponse = await this.courtApi.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }
    const courtFacility = await this.courtApi.getBuildingFacilities(courtId);
    if (typeof courtFacility === 'number') {
      return courtFacility;
    }
    return { ...courtFacility, name: courtResponse.name };
  }
  public async save(courtId: string, model: FacilityModel): Promise<FacilityModel | HttpStatusCode> {
    const courtResponse = await this.courtApi.getCourtById(courtId);
    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    // validate for errors
    const validationErrors = this.validate(model);
    if (validationErrors) {
      return { ...model, errors: validationErrors, name: courtResponse.name };
    }

    // persist to the API

    const result = await this.courtApi.updateBuildingFacilities(courtId, <UpdateBuildingFacilitiesRequest>model);
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
        message: COURT_BUILDING_FACILITIES_PARKING_REQUIRED_MESSAGE,
      },
      {
        key: 'waitingArea',
        value: model.waitingArea,
        message: COURT_BUILDING_FACILITIES_WAITING_AREA_REQUIRED_MESSAGE,
      },
      {
        key: 'quietRoom',
        value: model.quietRoom,
        message: COURT_BUILDING_FACILITIES_QUIET_ROOM_REQUIRED_MESSAGE,
      },
      {
        key: 'babyChanging',
        value: model.babyChanging,
        message: COURT_BUILDING_FACILITIES_BABY_CHANGING_REQUIRED_MESSAGE,
      },
      {
        key: 'wifi',
        value: model.wifi,
        message: COURT_BUILDING_FACILITIES_WIFI_REQUIRED_MESSAGE,
      },
    ];

    fields.forEach(({ key, value, message }) => {
      const fieldErrors = validateBooleanField(value, message);
      if (fieldErrors) {
        errors[key] = fieldErrors;
      }
    });

    if (model.waitingArea === true) {
      const childrenAreaErrors = validateBooleanField(
        model.waitingAreaChildren,
        COURT_BUILDING_FACILITIES_WAITING_AREA_CHILDREN_REQUIRED_MESSAGE
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
