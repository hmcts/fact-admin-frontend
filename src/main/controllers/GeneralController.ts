import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { GeneralService, GeneralViewModel } from '../services/GeneralService';
import { isUuid } from '../utils/valueParsers';

import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

const generalService = new GeneralService();

@route('/courts/:courtId/edit/general')
export default class GeneralController {
  @GET()
  public async renderEditView(req: Request, res: Response): Promise<void> {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;
    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const model = await generalService.retrieve(resolvedCourtId);

    if (model === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof model === 'number') {
      res.status(model);
      return res.render('error');
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
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;
    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
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
    if (updateResponse === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof updateResponse === 'number') {
      res.status(updateResponse);
      return res.render('error');
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
