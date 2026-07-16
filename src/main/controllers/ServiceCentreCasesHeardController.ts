import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { SubjectType } from '../schemas/subjectTypeSchema';
import { ServiceCentreCasesHeardService } from '../services/ServiceCentreCasesHeardService';

import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';
import { renderError, renderServiceCentreNotFound } from './helpers/responseRenderers';
import { getUuidRouteParam } from './helpers/routeParams';

const serviceCentreCasesHeardService = new ServiceCentreCasesHeardService();

@route('/service-centres/:serviceCentreId/edit/cases-heard')
export default class ServiceCentreCasesHeardController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const viewModel = await serviceCentreCasesHeardService.getCasesHeardPage(serviceCentreId);

    if (viewModel === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }

    if (typeof viewModel === 'number') {
      renderError(res, viewModel);
      return;
    }

    res.render('service-centre-cases-heard', {
      ...viewModel,
      breadcrumbs: this.buildCasesHeardBreadcrumbs(serviceCentreId, viewModel.serviceCentreName),
    });
  }

  @route('/success')
  @POST()
  public async postSuccess(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const selectedAreasOfLaw = serviceCentreCasesHeardService.getSelectedAreasOfLaw(req.body?.areasOfLaw);
    const saveResult = await serviceCentreCasesHeardService.saveCasesHeard(serviceCentreId, selectedAreasOfLaw);

    if (saveResult.type === 'validation_error') {
      res.status(HttpStatusCode.BadRequest);
      res.render('service-centre-cases-heard', {
        ...saveResult.viewModel,
        breadcrumbs: this.buildCasesHeardBreadcrumbs(serviceCentreId, saveResult.viewModel.serviceCentreName),
      });
      return;
    }

    if (saveResult.type === 'status') {
      if (saveResult.status === HttpStatusCode.NotFound) {
        renderServiceCentreNotFound(res);
        return;
      }
      renderError(res, saveResult.status);
      return;
    }

    res.render('common-edit-success', {
      breadcrumbs: this.buildCasesHeardBreadcrumbs(
        serviceCentreId,
        saveResult.viewModel.serviceCentreName,
        'Cases heard saved'
      ),
      continueUpdatingHref: `/service-centres/${serviceCentreId}/edit`,
      continueUpdatingText: `Continue updating ${saveResult.viewModel.serviceCentreName}`,
      courtId: serviceCentreId,
      courtName: saveResult.viewModel.serviceCentreName,
      pageTitle: `Cases heard saved - ${saveResult.viewModel.serviceCentreName}`,
      successPanelBody: `Cases heard for ${saveResult.viewModel.serviceCentreName} have been saved successfully.`,
      successPanelTitle: 'Cases heard saved',
    });
  }

  private buildCasesHeardBreadcrumbs(serviceCentreId: string, serviceCentreName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(
      serviceCentreId,
      serviceCentreName,
      'Cases heard',
      'cases-heard',
      currentPage,
      SubjectType.SERVICE_CENTRE
    );
  }
}
