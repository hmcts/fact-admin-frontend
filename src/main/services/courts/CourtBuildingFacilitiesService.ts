import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { UpdateBuildingFacilitiesRequest } from '../../requests/types/UpdateBuildingFacilitiesRequest';
import { BuildingFacilities } from '../../schemas/buildingFacilitiesSchema';
import {
  COURT_BUILDING_FACILITIES_BABY_CHANGING_REQUIRED_MESSAGE,
  COURT_BUILDING_FACILITIES_PARKING_REQUIRED_MESSAGE,
  COURT_BUILDING_FACILITIES_QUIET_ROOM_REQUIRED_MESSAGE,
  COURT_BUILDING_FACILITIES_WAITING_AREA_CHILDREN_REQUIRED_MESSAGE,
  COURT_BUILDING_FACILITIES_WAITING_AREA_REQUIRED_MESSAGE,
  COURT_BUILDING_FACILITIES_WIFI_REQUIRED_MESSAGE,
} from '../../utils/constants/messageConstants';
import { validateRequiredBooleanFields } from '../../utils/validation';

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
    const errors = validateRequiredBooleanFields(model, [
      {
        key: 'parking',
        value: currentModel => currentModel.parking,
        message: COURT_BUILDING_FACILITIES_PARKING_REQUIRED_MESSAGE,
      },
      {
        key: 'waitingArea',
        value: currentModel => currentModel.waitingArea,
        message: COURT_BUILDING_FACILITIES_WAITING_AREA_REQUIRED_MESSAGE,
      },
      {
        key: 'quietRoom',
        value: currentModel => currentModel.quietRoom,
        message: COURT_BUILDING_FACILITIES_QUIET_ROOM_REQUIRED_MESSAGE,
      },
      {
        key: 'babyChanging',
        value: currentModel => currentModel.babyChanging,
        message: COURT_BUILDING_FACILITIES_BABY_CHANGING_REQUIRED_MESSAGE,
      },
      {
        key: 'wifi',
        value: currentModel => currentModel.wifi,
        message: COURT_BUILDING_FACILITIES_WIFI_REQUIRED_MESSAGE,
      },
      {
        key: 'waitingAreaChildren',
        value: currentModel => currentModel.waitingAreaChildren,
        message: COURT_BUILDING_FACILITIES_WAITING_AREA_CHILDREN_REQUIRED_MESSAGE,
        when: currentModel => currentModel.waitingArea === true,
      },
    ]);

    return Object.keys(errors).length > 0 ? errors : undefined;
  }
  private isHttpStatusCode(response: unknown): response is HttpStatusCode {
    return typeof response === 'number';
  }
}
