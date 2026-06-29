import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CasesHeardService } from '../services/CasesHeardService';
import { isUuid } from '../utils/valueParsers';

const casesHeardService = new CasesHeardService();

type Confirmations = {
  Adoption: boolean;
  Children: boolean;
  Divorce: boolean;
};

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

    const confirmations: Confirmations = {
      Adoption: req.body?.adoption && !selectedAreasOfLaw.includes(req.body?.adoption),
      Children: req.body?.children && !selectedAreasOfLaw.includes(req.body?.children),
      Divorce: req.body?.divorce && !selectedAreasOfLaw.includes(req.body?.divorce),
    };

    // if we have any confirmation matches then we need to show the confirmation page, provided
    // there is at least one selected are of law. If no areas of law are selected then we fall
    // through and let the validation trap the invalid form content.
    if (selectedAreasOfLaw.length > 0 && Object.values(confirmations).some(Boolean)) {
      return this.renderConfirmationPage(res, confirmations, resolvedCourtId, req.body.courtName, selectedAreasOfLaw);
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

    return res.render('common-edit-success', {
      courtId: resolvedCourtId,
      pageTitle: `Cases heard saved - ${saveResult.viewModel.courtName}`,
      successPanelTitle: 'Cases heard saved',
      successPanelBody: `Cases heard for ${saveResult.viewModel.courtName} have been saved successfully.`,
      courtName: saveResult.viewModel.courtName,
    });
  }

  private renderConfirmationPage(
    res: Response,
    confirmations: Confirmations,
    resolvedCourtId: string,
    courtName: string,
    selectedAreasOfLaw: string[]
  ) {
    const selectedAuthorityList: string[] = [];
    Object.keys(confirmations)
      .filter(key => confirmations[key])
      .forEach(k => selectedAuthorityList.push(k));

    let message = '';
    if (selectedAuthorityList.length > 1) {
      message = `You are removing the cases heard types: ${selectedAuthorityList.join(', ')}. These are being used by the local authorities admin page. If you remove them it will remove the local authority config. Do you want to remove them?`;
    } else {
      message = `You are removing the cases heard type of ${selectedAuthorityList[0]}. This is being used by the local authorities admin page. If you remove this it will remove the local authority config. Do you want to remove this?`;
    }

    return res.render('cases-heard-confirm', {
      courtId: resolvedCourtId,
      courtName,
      selectedAreasOfLaw,
      message,
    });
  }
}
