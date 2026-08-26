import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';

import { BuildingFacilitiesService, FacilityModel } from '../services/BuildingFacilitiesService';
import { addFoodAndDrink, mapFoodAndDrink } from '../utils/mapper';
import { parseBoolean } from '../utils/valueParsers';

import BaseController from './BaseController';
import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

const buildingFacilitiesService = new BuildingFacilitiesService();
@route('/courts/:courtId/edit/building-facilities')
export default class BuildingFacilitiesController extends BaseController {
  @GET()
  public async renderEditView(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.getUuidRouteParam(req, 'courtId');
    if (!resolvedCourtId) {
      return this.renderCourtNotFound(res);
    }

    const model = await buildingFacilitiesService.retrieve(resolvedCourtId);

    if (this.renderStatusResponse(res, model, 'court-not-found')) {
      return;
    }
    const result = addFoodAndDrink(model);
    res.render('building-facilities-edit', {
      breadcrumbs: this.buildBuildingFacilitiesBreadcrumbs(resolvedCourtId, model.name!),
      courtId: resolvedCourtId,
      model: result,
      pageTitle: `Building Facilities - ${model.name}`,
    });
  }

  @route('/success')
  @POST()
  public async updateCourt(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.getUuidRouteParam(req, 'courtId');
    if (!resolvedCourtId) {
      return this.renderCourtNotFound(res);
    }

    const { parking, foodAndDrink, waitingArea, quietRoom, babyChanging, wifi, waitingAreaChildren } =
      req.body as Partial<FacilityModel>;
    const { freeWaterDispensers, snackVendingMachines, drinkVendingMachines, cafeteria } =
      mapFoodAndDrink(foodAndDrink);
    const model = {
      courtId: resolvedCourtId,
      parking: parseBoolean(parking),
      freeWaterDispensers,
      snackVendingMachines,
      drinkVendingMachines,
      cafeteria,
      waitingArea: parseBoolean(waitingArea),
      quietRoom: parseBoolean(quietRoom),
      waitingAreaChildren: parseBoolean(waitingArea) === true ? parseBoolean(waitingAreaChildren) : undefined,
      babyChanging: parseBoolean(babyChanging),
      wifi: parseBoolean(wifi),
    };
    const updateResponse = await buildingFacilitiesService.save(resolvedCourtId, model);
    if (this.renderStatusResponse(res, updateResponse, 'court-not-found')) {
      return;
    }

    if (updateResponse.errors) {
      res.render('building-facilities-edit', {
        breadcrumbs: this.buildBuildingFacilitiesBreadcrumbs(resolvedCourtId, updateResponse.name!),
        courtId: resolvedCourtId,
        model: addFoodAndDrink(updateResponse),
        pageTitle: `Error: Building Facilities - ${updateResponse.name}`,
      });
      return;
    }

    res.render('common-edit-success', {
      breadcrumbs: this.buildBuildingFacilitiesBreadcrumbs(
        resolvedCourtId,
        updateResponse.name!,
        'Building facilities saved'
      ),
      courtId: resolvedCourtId,
      pageTitle: `Building Facilities saved - ${updateResponse.name}`,
      successPanelTitle: 'Building Facilities details saved',
      successPanelBody: `Building Facilities details for ${updateResponse.name} have been saved successfully.`,
      courtName: updateResponse.name,
    });
  }

  private buildBuildingFacilitiesBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(courtId, courtName, 'Building facilities', 'building-facilities', currentPage);
  }
}
