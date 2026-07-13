import { HttpStatusCode } from 'axios';

import { DataApiRequests } from '../requests/DataApiRequests';
import { UpdateAccessibilityRequest } from '../requests/types/UpdateAccessibilityRequest';
import { Accessibility } from '../schemas/accessibilitySchema';
import { validate } from '../utils/accessibilityValidationConfig';
import { mapHearingEnhancementEquipment } from '../utils/mapper';

export type AccessibilityModel = Partial<Accessibility> & { errors?: Record<string, string[]> } & { name?: string };

export class AccessibilityService {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  public async retrieve(courtId: string): Promise<Partial<AccessibilityModel> | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);

    if (this.isHttpStatusCode(courtResponse)) {
      return courtResponse;
    }
    const accessibleFacility = await this.dataApiRequests.getAccessibility(courtId);
    if (typeof accessibleFacility === 'number') {
      return accessibleFacility;
    }
    return { ...accessibleFacility, name: courtResponse.name };
  }
  public async save(courtId: string, model: AccessibilityModel): Promise<AccessibilityModel | HttpStatusCode> {
    const courtResponse = await this.dataApiRequests.getCourtById(courtId);
    if (this.isHttpStatusCode(courtResponse)) {
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

    const result = await this.dataApiRequests.updateAccessibility(courtId, payload);
    if (typeof result === 'number') {
      return result;
    }

    // if it's a Map, it's validation errors from the API
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

  private isHttpStatusCode(response: unknown): response is HttpStatusCode {
    return typeof response === 'number';
  }
}
