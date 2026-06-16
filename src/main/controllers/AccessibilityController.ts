import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { AccessibilityService, FacilityModel } from '../services/AccessibilityService';
import { isHearingEnhancementEquipment } from '../utils/mapper';
import { isUuid, parseBoolean, parseLiftMetric } from '../utils/valueParsers';

const accessibilityService = new AccessibilityService();

@route('/courts/:courtId/edit/accessibility')
export default class AccessibilityController {
  @GET()
  public async renderEditView(req: Request, res: Response): Promise<void> {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;
    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const model = await accessibilityService.retrieve(resolvedCourtId);

    if (model === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }
    if (typeof model === 'number') {
      res.status(model);
      return res.render('error');
    }

    res.render('accessibility-edit', {
      courtId: resolvedCourtId,
      model,
      pageTitle: `Accessibility - ${model.name}`,
    });
  }

  @route('/success')
  @POST()
  public async updateCourt(req: Request, res: Response): Promise<void> {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;
    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const {
      accessibleParking,
      accessibleParkingPhoneNumber,
      accessibleToiletDescription,
      accessibleEntrance,
      accessibleEntrancePhoneNumber,
      hearingEnhancementEquipment,
      lift,
      liftDoorWidth,
      liftDoorLimit,
      quietRoom,
    } = req.body as Record<string, unknown>;

    const model: Partial<FacilityModel> = {
      courtId: resolvedCourtId,
      accessibleParking: parseBoolean(accessibleParking),
      accessibleParkingPhoneNumber:
        typeof accessibleParkingPhoneNumber === 'string' && parseBoolean(accessibleParking) === true
          ? accessibleParkingPhoneNumber
          : undefined,
      accessibleToiletDescription:
        typeof accessibleToiletDescription === 'string' ? accessibleToiletDescription : undefined,
      accessibleToiletDescriptionCy:
        typeof accessibleToiletDescription === 'string' ? accessibleToiletDescription : undefined,
      accessibleEntrance: parseBoolean(accessibleEntrance),
      accessibleEntrancePhoneNumber:
        typeof accessibleEntrancePhoneNumber === 'string' && parseBoolean(accessibleEntrance) === false
          ? accessibleEntrancePhoneNumber
          : undefined,
      hearingEnhancementEquipment: isHearingEnhancementEquipment(hearingEnhancementEquipment)
        ? hearingEnhancementEquipment
        : undefined,
      lift: parseBoolean(lift),
      liftDoorWidth: parseBoolean(lift) === true ? parseLiftMetric(liftDoorWidth) : undefined,
      liftDoorLimit: parseBoolean(lift) === true ? parseLiftMetric(liftDoorLimit) : undefined,
      quietRoom: parseBoolean(quietRoom),
    };

    const updateResponse = await accessibilityService.save(resolvedCourtId, model as FacilityModel);
    if (updateResponse === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof updateResponse === 'number') {
      res.status(updateResponse);
      return res.render('error');
    }

    if (updateResponse.errors) {
      res.render('accessibility-edit', {
        courtId: resolvedCourtId,
        model: updateResponse as FacilityModel,
        pageTitle: `Error: Accessibility - ${updateResponse.name}`,
      });
      return;
    }

    res.render('common-edit-success', {
      courtId: resolvedCourtId,
      pageTitle: `Accessibility saved - ${updateResponse.name}`,
      successPanelTitle: 'Accessibility details saved',
      successPanelBody: `Accessibility details saved for ${updateResponse.name}`,
      //task: 'Accessibility',
      // prefer the court name from the updated model
      courtName: updateResponse.name,
    });
  }
}
