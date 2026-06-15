import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { BuildingFacilitiesService, FacilityModel } from '../services/BuildingFacilitiesService';
import { addFoodAndDrink, mapFoodAndDrink } from '../utils/mapper';
import { isUuid, parseBoolean } from '../utils/valueParsers';

const buildingFacilitiesService = new BuildingFacilitiesService();
@route('/courts/:courtId/edit/building-facilities')
export default class BuildingFacilitiesController {
  @GET()
  public async renderEditView(req: Request, res: Response): Promise<void> {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;
    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const model = await buildingFacilitiesService.retrieve(resolvedCourtId);

    if (model === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }
    if (typeof model === 'number') {
      res.status(model);
      return res.render('error');
    }
    const result = addFoodAndDrink(model);
    res.render('building-facilities-edit', {
      courtId: resolvedCourtId,
      model: result,
      pageTitle: `Building Facilities - ${model.name}`,
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
    if (updateResponse === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof updateResponse === 'number') {
      res.status(updateResponse);
      return res.render('error');
    }

    if (updateResponse.errors) {
      res.render('building-facilities-edit', {
        courtId: resolvedCourtId,
        model: addFoodAndDrink(updateResponse),
        pageTitle: `Error: Building Facilities - ${updateResponse.name}`,
      });
      return;
    }

    res.render('common-edit-success', {
      courtId: resolvedCourtId,
      pageTitle: `Building Facilities saved - ${updateResponse.name}`,
      successPanelTitle: 'Building Facilities details saved',
      successPanelBody: `Building Facilities details saved for ${updateResponse.name} have been saved successfully.`,
      courtName: updateResponse.name,
    });
  }
}
