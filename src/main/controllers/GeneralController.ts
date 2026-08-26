import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';

import { GeneralService, GeneralViewModel } from '../services/GeneralService';

import BaseController from './BaseController';
import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

const generalService = new GeneralService();

@route('/courts/:courtId/edit/general')
export default class GeneralController extends BaseController {
  @GET()
  public async renderEditView(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.getUuidRouteParam(req, 'courtId');
    if (!resolvedCourtId) {
      return this.renderCourtNotFound(res);
    }

    const model = await generalService.retrieve(resolvedCourtId);

    if (this.renderStatusResponse(res, model, 'court-not-found')) {
      return;
    }

    res.render('general-edit', {
      breadcrumbs: this.buildSectionBreadcrumbs(resolvedCourtId, model.name!, 'General'),
      model,
      pageTitle: `General - ${model.name}`,
    });
  }

  @route('/success')
  @POST()
  public async updateCourt(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.getUuidRouteParam(req, 'courtId');
    if (!resolvedCourtId) {
      return this.renderCourtNotFound(res);
    }

    // parse the open field. The body contains a string, which we need to
    // turn into a boolean or an undefined if nothing was set. Sonar doesn't
    // like nested ternaries, so we have to do this the long way.
    const open = req.body?.open;
    let resolvedOpen: boolean | undefined = undefined;
    if (open !== undefined) {
      if (open === 'true') {
        resolvedOpen = true;
      } else if (open === 'false') {
        resolvedOpen = false;
      } else {
        resolvedOpen = undefined;
      }
    }

    const model: GeneralViewModel = {
      id: resolvedCourtId,
      name: req.body?.name ?? undefined,
      open: resolvedOpen,
      regionId: req.body?.regionId ?? undefined,
    };

    const updateResponse = await generalService.save(model);
    if (this.renderStatusResponse(res, updateResponse, 'court-not-found')) {
      return;
    }

    if (updateResponse.errors) {
      res.render('general-edit', {
        breadcrumbs: this.buildSectionBreadcrumbs(
          resolvedCourtId,
          updateResponse.originalName! ?? updateResponse.name,
          'General'
        ),
        model: updateResponse,
        pageTitle: `Error: General - ${updateResponse.originalName ?? updateResponse.name}`,
      });
      return;
    }

    return res.render('common-edit-success', {
      breadcrumbs: this.buildSectionBreadcrumbs(
        resolvedCourtId,
        updateResponse.name ?? model.name!,
        'General',
        'General saved'
      ),
      courtId: resolvedCourtId,
      pageTitle: `General saved - ${updateResponse.name}`,
      successPanelTitle: 'General details saved',
      successPanelBody: `General details for ${updateResponse.name} have been saved successfully.`,
      courtName: updateResponse.name ?? model.name,
    });
  }

  private buildSectionBreadcrumbs(courtId: string, courtName: string, section: string, currentPage?: string) {
    return buildSectionBreadcrumbs(courtId, courtName, section, section.toLowerCase().replace(/ /g, '-'), currentPage);
  }
}
