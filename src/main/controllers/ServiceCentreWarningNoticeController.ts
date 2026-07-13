import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { ServiceCentreWarningNoticeService } from '../services/ServiceCentreWarningNoticeService';

import { renderError, renderServiceCentreNotFound } from './helpers/responseRenderers';
import { getUuidRouteParam } from './helpers/routeParams';

const serviceCentreWarningNoticeService = new ServiceCentreWarningNoticeService();

@route('/service-centres/:serviceCentreId/edit/warning-notice')
export default class ServiceCentreWarningNoticeController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const viewModel = await serviceCentreWarningNoticeService.retrieve(serviceCentreId);
    if (viewModel === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }

    if (typeof viewModel === 'number') {
      renderError(res, viewModel);
      return;
    }

    res.render('service-centre-warning-notice-edit', {
      model: viewModel,
      pageTitle: viewModel.pageTitle,
    });
  }

  @route('/success')
  @POST()
  public async save(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const saveResult = await serviceCentreWarningNoticeService.save(serviceCentreId, req.body?.warningNotice);

    if (saveResult.type === 'validation-error') {
      res.status(HttpStatusCode.BadRequest);
      res.render('service-centre-warning-notice-edit', {
        model: saveResult.viewModel,
        pageTitle: saveResult.viewModel.pageTitle,
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
      continueUpdatingHref: `/service-centres/${serviceCentreId}/edit`,
      continueUpdatingText: `Continue updating ${saveResult.viewModel.name}`,
      courtId: serviceCentreId,
      courtName: saveResult.viewModel.name,
      pageTitle: `Warning notice saved - ${saveResult.viewModel.name}`,
      successPanelBody: `Warning notice for ${saveResult.viewModel.name} has been saved successfully.`,
      successPanelTitle: 'Warning notice saved',
    });
  }
}
