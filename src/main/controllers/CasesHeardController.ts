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
      return res.render('court-not-found');
    }

    const viewModel = await casesHeardService.getCasesHeardPage(resolvedCourtId);

    if (viewModel === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof viewModel === 'number') {
      res.status(viewModel);
      return res.render('error');
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
      return res.render('court-not-found');
    }

    const selectedAreasOfLaw = casesHeardService.getSelectedAreasOfLaw(req.body?.areasOfLaw);

    const confirmAdoption = req.body?.adoption && !selectedAreasOfLaw.includes(req.body?.adoption);
    const confirmChildcare = req.body?.children && !selectedAreasOfLaw.includes(req.body?.children);
    const confirmDivorce = req.body?.divorce && !selectedAreasOfLaw.includes(req.body?.divorce);

    // if we have any confirmation matches then we need to show the confirmation page, provided
    // there is at least one selected are of law. If no areas of law are selected then we fall
    // through and let the validation trap the invalid form content.
    if (selectedAreasOfLaw.length > 0 && (confirmAdoption || confirmChildcare || confirmDivorce)) {
      return this.renderConfirmationPage(
        res,
        confirmAdoption,
        confirmChildcare,
        confirmDivorce,
        resolvedCourtId,
        selectedAreasOfLaw
      );
    }

    const saveResult = await casesHeardService.saveCasesHeard(resolvedCourtId, selectedAreasOfLaw);

    if (saveResult.type === 'validation_error') {
      res.status(HttpStatusCode.BadRequest);
      return res.render('cases-heard', saveResult.viewModel);
    }

    if (saveResult.type === 'status' && saveResult.status === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (saveResult.type === 'status') {
      res.status(saveResult.status);
      return res.render('error');
    }

    res.render('cases-heard-success', saveResult.viewModel);
  }

  private renderConfirmationPage(
    res: Response,
    confirmAdoption: boolean,
    confirmChildcare: boolean,
    confirmDivorce: boolean,
    resolvedCourtId: string,
    selectedAreasOfLaw: string[]
  ) {
    const typeList: string[] = [
      confirmAdoption && 'Adoption',
      confirmChildcare && 'Children',
      confirmDivorce && 'Divorce',
    ].filter(Boolean) as string[];

    let message = '';
    if (typeList.length > 1) {
      message = `You are removing the cases heard types: ${typeList.join(',')}. These are being used by the local authorities admin page. If you remove them it will remove the local authority config. Do you want to remove them?`;
    } else {
      message = `You are removing the cases heard type of ${typeList[0]}. This is being used by the local authorities admin page. If you remove this it will remove the local authority config. Do you want to remove this?`;
    }

    return res.render('cases-heard-confirm', {
      courtId: resolvedCourtId,
      selectedAreasOfLaw,
      message,
    });
  }
}
