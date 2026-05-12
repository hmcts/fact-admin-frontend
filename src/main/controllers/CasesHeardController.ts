import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CasesHeardService } from '../services/CasesHeardService';
import { isUuid } from '../utils/valueParsers';

const casesHeardService = new CasesHeardService();

@route('/courts/:courtId/edit/cases-heard')
export default class CasesHeardController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      res.render('court-not-found');
      return;
    }

    const viewModel = await casesHeardService.getCasesHeardPage(resolvedCourtId);

    if (viewModel === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      res.render('court-not-found');
      return;
    }

    if (typeof viewModel === 'number') {
      res.status(viewModel);
      res.render('error');
      return;
    }

    res.render('cases-heard', viewModel);
  }

  @route('/success')
  @POST()
  public async postSuccess(req: Request, res: Response): Promise<void> {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      res.render('court-not-found');
      return;
    }

    const selectedAreasOfLaw = casesHeardService.getSelectedAreasOfLaw(req.body?.areasOfLaw);
    const saveResult = await casesHeardService.saveCasesHeard(resolvedCourtId, selectedAreasOfLaw);

    if (saveResult.type === 'validation_error') {
      res.status(HttpStatusCode.BadRequest);
      res.render('cases-heard', saveResult.viewModel);
      return;
    }

    if (saveResult.type === 'status' && saveResult.status === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      res.render('court-not-found');
      return;
    }

    if (saveResult.type === 'status') {
      res.status(saveResult.status);
      res.render('error');
      return;
    }

    res.render('cases-heard-success', saveResult.viewModel);
  }
}
