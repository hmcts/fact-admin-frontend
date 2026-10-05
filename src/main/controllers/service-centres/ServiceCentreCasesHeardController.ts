import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { SubjectType } from '../../schemas/subjectTypeSchema';
import { ServiceCentreCasesHeardService } from '../../services/service-centres/ServiceCentreCasesHeardService';
import BaseController from '../BaseController';

@route('/service-centres/:serviceCentreId/edit/cases-heard')
export default class ServiceCentreCasesHeardController extends BaseController {
  constructor(private readonly serviceCentreCasesHeardService = new ServiceCentreCasesHeardService()) {
    super();
  }

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const viewModel = await this.serviceCentreCasesHeardService.getCasesHeardPage(serviceCentreId);

    if (this.renderStatusResponse(res, viewModel, 'service-centre-not-found')) {
      return;
    }

    res.render('service-centre-cases-heard', {
      ...viewModel,
    });
  }

  @route('/success')
  @POST()
  public async postSuccess(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const selectedAreasOfLaw = this.serviceCentreCasesHeardService.getSelectedAreasOfLaw(req.body?.areasOfLaw);
    const saveResult = await this.serviceCentreCasesHeardService.saveCasesHeard(serviceCentreId, selectedAreasOfLaw);

    if (saveResult.type === 'validation_error') {
      res.status(HttpStatusCode.BadRequest);
      res.render('service-centre-cases-heard', {
        ...saveResult.viewModel,
      });
      return;
    }

    if (saveResult.type === 'status') {
      this.renderStatus(res, saveResult.status, 'service-centre-not-found');
      return;
    }

    res.render('common-edit-success', {
      continueUpdatingHref: `/service-centres/${serviceCentreId}/edit`,
      continueUpdatingText: `Continue updating ${saveResult.viewModel.serviceCentreName}`,
      subjectId: serviceCentreId,
      subjectName: saveResult.viewModel.serviceCentreName,
      subjectType: SubjectType.SERVICE_CENTRE,
      pageTitle: `Cases heard saved - ${saveResult.viewModel.serviceCentreName}`,
      successPanelBody: `Cases heard for ${saveResult.viewModel.serviceCentreName} have been saved successfully.`,
      successPanelTitle: 'Cases heard saved',
    });
  }
}
