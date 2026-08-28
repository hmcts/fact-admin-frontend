import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CasesHeardService } from '../services/CasesHeardService';

import BaseController from './BaseController';
import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

type Confirmations = {
  Adoption: boolean;
  Children: boolean;
  Divorce: boolean;
};

@route('/courts/:courtId/edit/cases-heard')
export default class CasesHeardController extends BaseController {
  constructor(private readonly casesHeardService = new CasesHeardService()) {
    super();
  }

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.getUuidRouteParam(req, 'courtId');

    if (!resolvedCourtId) {
      return this.renderCourtNotFound(res);
    }

    const viewModel = await this.casesHeardService.getCasesHeardPage(resolvedCourtId);

    if (this.renderStatusResponse(res, viewModel, 'court-not-found')) {
      return;
    }

    return res.render('cases-heard', {
      ...viewModel,
      breadcrumbs: this.buildCasesHeardBreadcrumbs(resolvedCourtId, viewModel.courtName),
    });
  }

  @route('/success')
  @POST()
  public async postSuccess(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.getUuidRouteParam(req, 'courtId');

    if (!resolvedCourtId) {
      return this.renderCourtNotFound(res);
    }

    const selectedAreasOfLaw = this.casesHeardService.getSelectedAreasOfLaw(req.body?.areasOfLaw);

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

    const saveResult = await this.casesHeardService.saveCasesHeard(resolvedCourtId, selectedAreasOfLaw);

    if (saveResult.type === 'validation_error') {
      return res.status(HttpStatusCode.BadRequest).render('cases-heard', {
        ...saveResult.viewModel,
        breadcrumbs: this.buildCasesHeardBreadcrumbs(resolvedCourtId, saveResult.viewModel.courtName),
      });
    }

    if (saveResult.type === 'status') {
      return this.renderStatus(res, saveResult.status, 'court-not-found');
    }

    return res.render('common-edit-success', {
      breadcrumbs: this.buildCasesHeardBreadcrumbs(
        resolvedCourtId,
        saveResult.viewModel.courtName,
        'Cases heard saved'
      ),
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
      breadcrumbs: this.buildCasesHeardBreadcrumbs(resolvedCourtId, courtName, 'Cases heard confirm update'),
      cancelHref: `/courts/${resolvedCourtId}/edit/cases-heard`,
      courtId: resolvedCourtId,
      courtName,
      selectedAreasOfLaw,
      message,
    });
  }

  private buildCasesHeardBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(courtId, courtName, 'Cases heard', 'cases-heard', currentPage);
  }
}
