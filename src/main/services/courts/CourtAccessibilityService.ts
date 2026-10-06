import { HttpStatusCode } from 'axios';

import { CourtApi } from '../../requests/CourtApi';
import { UpdateAccessibilityRequest } from '../../requests/types/UpdateAccessibilityRequest';
import { Accessibility } from '../../schemas/accessibilitySchema';
import { validate } from '../../utils/accessibilityValidationConfig';
import { isHttpStatusCode, toValidationErrorRecord } from '../../utils/apiResponses';
import { mapHearingEnhancementEquipment } from '../../utils/mapper';

export type AccessibilityModel = Partial<Accessibility> & { errors?: Record<string, string[]> } & { name?: string };

export class CourtAccessibilityService {
  public constructor(private readonly courtApi = new CourtApi()) {}

  public async retrieve(courtId: string): Promise<Partial<AccessibilityModel> | HttpStatusCode> {
    const courtResponse = await this.courtApi.getCourtById(courtId);

    if (isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }
    const accessibleFacility = await this.courtApi.getAccessibility(courtId);
    if (isHttpStatusCode(accessibleFacility)) {
      return accessibleFacility;
    }
    return { ...accessibleFacility, name: courtResponse.name };
  }
  public async save(courtId: string, model: AccessibilityModel): Promise<AccessibilityModel | HttpStatusCode> {
    const courtResponse = await this.courtApi.getCourtById(courtId);
    if (isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }

    // validate for errors
    const validationErrors = validate(model);
    if (validationErrors) {
      return {
        ...model,
        errors: validationErrors,
        name: courtResponse.name,
      };
    }

    const payload: UpdateAccessibilityRequest = {
      ...model,
      hearingEnhancementEquipment: mapHearingEnhancementEquipment(model.hearingEnhancementEquipment),
    };

    const result = await this.courtApi.updateAccessibility(courtId, payload);
    if (isHttpStatusCode(result)) {
      return result;
    }

    // if it's a Map, it's validation errors from the API
    if (result instanceof Map) {
      // convert the mapped errors into our expected error format
      const errors = toValidationErrorRecord(result);
      return { ...model, errors, name: courtResponse.name };
    }

    // otherwise, it's a successful save
    return { ...result, name: courtResponse.name };
  }
}
