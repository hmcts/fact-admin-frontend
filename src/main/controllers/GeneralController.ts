import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { GeneralService, GeneralViewModel } from '../services/GeneralService';
import { isUuid } from '../utils/valueParsers';

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

    res.render('general-edit', { model });
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

    const model: GeneralViewModel = {
      id: courtId as string,
      name: req.body?.name ?? undefined,
      open: req.body?.open ?? undefined,
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
      res.render('general-edit', { model: updateResponse });
      return;
    }

    res.render('general-edit-success', {
      courtId,
      courtName: model.name,
    });
  }
}
