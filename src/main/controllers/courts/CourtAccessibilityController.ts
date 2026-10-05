import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';

import { AccessibilityModel, CourtAccessibilityService } from '../../services/courts/CourtAccessibilityService';
import { isHearingEnhancementEquipment } from '../../utils/mapper';
import { parseBoolean, parseLiftMetric } from '../../utils/valueParsers';
import BaseController from '../BaseController';
import { buildSectionBreadcrumbs } from '../helpers/breadcrumbs';

@route('/courts/:courtId/edit/accessibility')
export default class CourtAccessibilityController extends BaseController {
  constructor(private readonly accessibilityService = new CourtAccessibilityService()) {
    super();
  }

  @GET()
  public async renderEditView(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.getUuidRouteParam(req, 'courtId');
    if (!resolvedCourtId) {
      return this.renderCourtNotFound(res);
    }

    const model = await this.accessibilityService.retrieve(resolvedCourtId);

    if (this.renderStatusResponse(res, model, 'court-not-found')) {
      return;
    }

    return res.render('court-accessibility-edit', {
      breadcrumbs: this.buildAccessibilityBreadcrumbs(resolvedCourtId, model.name!),
      courtId: resolvedCourtId,
      model,
      pageTitle: `Accessibility - ${model.name}`,
    });
  }

  @route('/success')
  @POST()
  public async updateCourt(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.getUuidRouteParam(req, 'courtId');
    if (!resolvedCourtId) {
      return this.renderCourtNotFound(res);
    }

    const { liftDoorLimit, liftDoorWidth, model } = this.buildAccessibilityModel(req, resolvedCourtId);

    const updateResponse = await this.accessibilityService.save(resolvedCourtId, model as AccessibilityModel);
    if (this.renderStatusResponse(res, updateResponse, 'court-not-found')) {
      return;
    }

    if (updateResponse.errors) {
      const updatedLiftDoorLimit = Number.isNaN(updateResponse.liftDoorLimit)
        ? liftDoorLimit
        : updateResponse.liftDoorLimit;
      const updatedLiftDoorWidth = Number.isNaN(updateResponse.liftDoorWidth)
        ? liftDoorWidth
        : updateResponse.liftDoorWidth;

      this.redirectWithModel<AccessibilityModel & { liftDoorWidth: unknown; liftDoorLimit: unknown }>(
        req,
        res,
        { ...updateResponse, liftDoorLimit: updatedLiftDoorLimit, liftDoorWidth: updatedLiftDoorWidth },
        'error'
      );
      return;
    }

    return res.render('common-edit-success', {
      breadcrumbs: this.buildAccessibilityBreadcrumbs(resolvedCourtId, updateResponse.name!, 'Accessibility saved'),
      subjectId: resolvedCourtId,
      pageTitle: `Accessibility saved - ${updateResponse.name}`,
      successPanelTitle: 'Accessibility details saved',
      successPanelBody: `Accessibility details saved for ${updateResponse.name}`,
      subjectName: updateResponse.name,
    });
  }

  @route('/error')
  @GET()
  public async renderErrorView(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.getUuidRouteParam(req, 'courtId');
    if (!resolvedCourtId) {
      return this.renderCourtNotFound(res);
    }

    const token = typeof req.query.token === 'string' ? req.query.token : undefined;

    if (!token) {
      this.renderError(res, 400);
      return;
    }

    const key = `error-payload:${token}`;

    const storedPayload = await req.app.locals.redisClient.getDel(key);

    if (!storedPayload) {
      this.renderError(res, 500);
      return;
    }

    const updateResponse = JSON.parse(storedPayload) as AccessibilityModel;

    if (updateResponse) {
      res.render('court-accessibility-edit', {
        breadcrumbs: this.buildAccessibilityBreadcrumbs(resolvedCourtId, updateResponse.name!),
        courtId: resolvedCourtId,
        model: updateResponse,
        pageTitle: `Error: Accessibility - ${updateResponse.name}`,
      });
      return;
    }

    this.renderError(res, 500);
  }

  private buildAccessibilityModel(req: Request, resolvedCourtId: string) {
    const {
      accessibleParking,
      accessibleParkingPhoneNumber,
      accessibleToiletDescription,
      accessibleToiletDescriptionCy,
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
        typeof accessibleToiletDescriptionCy === 'string' ? accessibleToiletDescriptionCy : undefined,

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
    return { liftDoorWidth: liftDoorWidth as number, liftDoorLimit: liftDoorLimit as number, model };
  }

  private buildAccessibilityBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(courtId, courtName, 'Accessibility', 'accessibility', currentPage);
  }
}
