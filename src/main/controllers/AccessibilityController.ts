import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { AccessibilityModel, AccessibilityService } from '../services/AccessibilityService';
import { isHearingEnhancementEquipment } from '../utils/mapper';
import { isUuid, parseBoolean, parseLiftMetric } from '../utils/valueParsers';

import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

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

    return res.render('accessibility-edit', {
      breadcrumbs: this.buildAccessibilityBreadcrumbs(resolvedCourtId, model.name ?? 'Court'),
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
      return res.status(HttpStatusCode.NotFound).render('court-not-found');
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
      liftSupportPhoneNumber,
      quietRoom,
    } = req.body as Record<string, unknown>;

    const model: Partial<AccessibilityModel> = {
      courtId: resolvedCourtId,
      accessibleParking: parseBoolean(accessibleParking),
      accessibleParkingPhoneNumber:
        typeof accessibleParkingPhoneNumber === 'string' && parseBoolean(accessibleParking) === true
          ? accessibleParkingPhoneNumber
          : undefined,
      accessibleToiletDescription:
        typeof accessibleToiletDescription === 'string' ? accessibleToiletDescription : undefined,
      accessibleToiletDescriptionCy:
        typeof accessibleToiletDescription === 'string' ? accessibleToiletDescription : undefined, //change me - welsh
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
      liftSupportPhoneNumber:
        typeof liftSupportPhoneNumber === 'string' && parseBoolean(lift) === false ? liftSupportPhoneNumber : undefined,
      quietRoom: parseBoolean(quietRoom),
    };

    const updateResponse = await accessibilityService.save(resolvedCourtId, model as AccessibilityModel);
    if (updateResponse === HttpStatusCode.NotFound) {
      return res.status(HttpStatusCode.NotFound).render('court-not-found');
    }

    if (typeof updateResponse === 'number') {
      return res.status(updateResponse).render('error');
    }

    if (updateResponse.errors) {
      const updatedLiftDoorLimit = Number.isNaN(updateResponse.liftDoorLimit) ? liftDoorLimit : model.liftDoorLimit;
      const updatedLiftDoorWidth = Number.isNaN(updateResponse.liftDoorWidth) ? liftDoorWidth : model.liftDoorWidth;

      return res.render('accessibility-edit', {
        breadcrumbs: this.buildAccessibilityBreadcrumbs(resolvedCourtId, updateResponse.name ?? 'Court'),
        courtId: resolvedCourtId,
        model: { ...updateResponse, liftDoorWidth: updatedLiftDoorLimit, liftDoorLimit: updatedLiftDoorWidth },
        pageTitle: `Error: Accessibility - ${updateResponse.name}`,
      });
    }

    return res.render('common-edit-success', {
      breadcrumbs: this.buildAccessibilityBreadcrumbs(
        resolvedCourtId,
        updateResponse.name ?? 'Court',
        'Accessibility saved'
      ),
      courtId: resolvedCourtId,
      pageTitle: `Accessibility saved - ${updateResponse.name}`,
      successPanelTitle: 'Accessibility details saved',
      successPanelBody: `Accessibility details saved for ${updateResponse.name}`,
      courtName: updateResponse.name,
    });
  }

  private buildAccessibilityBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(courtId, courtName, 'Accessibility', 'accessibility', currentPage);
  }
}
