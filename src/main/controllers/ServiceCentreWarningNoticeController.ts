import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { SubjectType } from '../schemas/subjectTypeSchema';
import { ServiceCentreWarningNoticeService } from '../services/ServiceCentreWarningNoticeService';

import BaseController from './BaseController';
import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

@route('/service-centres/:serviceCentreId/edit/warning-notice')
export default class ServiceCentreWarningNoticeController extends BaseController {
  constructor(private readonly serviceCentreWarningNoticeService = new ServiceCentreWarningNoticeService()) {
    super();
  }

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const viewModel = await this.serviceCentreWarningNoticeService.retrieve(serviceCentreId);
    if (this.renderStatusResponse(res, viewModel, 'service-centre-not-found')) {
      return;
    }

    res.render('service-centre-warning-notice-edit', {
      breadcrumbs: this.buildSectionBreadcrumbs(serviceCentreId, viewModel.name, 'Warning notice'),
      model: viewModel,
      pageTitle: viewModel.pageTitle,
    });
  }

  @route('/success')
  @POST()
  public async save(req: Request, res: Response): Promise<void> {
    const serviceCentreId = this.getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      this.renderServiceCentreNotFound(res);
      return;
    }

    const saveResult = await this.serviceCentreWarningNoticeService.save(
      serviceCentreId,
      req.body?.warningNotice,
      req.body?.warningNoticeCy
    );

    if (saveResult.type === 'validation-error') {
      res.status(HttpStatusCode.BadRequest);
      res.render('service-centre-warning-notice-edit', {
        breadcrumbs: this.buildSectionBreadcrumbs(serviceCentreId, saveResult.viewModel.name, 'Warning notice'),
        model: saveResult.viewModel,
        pageTitle: saveResult.viewModel.pageTitle,
      });
      return;
    }

    if (saveResult.type === 'status') {
      this.renderStatus(res, saveResult.status, 'service-centre-not-found');
      return;
    }

    res.render('common-edit-success', {
      breadcrumbs: this.buildSectionBreadcrumbs(
        serviceCentreId,
        saveResult.viewModel.name,
        'Warning notice',
        'Warning notice saved'
      ),
      continueUpdatingHref: `/service-centres/${serviceCentreId}/edit`,
      continueUpdatingText: `Continue updating ${saveResult.viewModel.name}`,
      courtId: serviceCentreId,
      courtName: saveResult.viewModel.name,
      pageTitle: `Warning notice saved - ${saveResult.viewModel.name}`,
      successPanelBody: `Warning notice for ${saveResult.viewModel.name} has been saved successfully.`,
      successPanelTitle: 'Warning notice saved',
    });
  }

  private buildSectionBreadcrumbs(
    serviceCentreId: string,
    serviceCentreName: string,
    section: string,
    currentPage?: string
  ) {
    return buildSectionBreadcrumbs(
      serviceCentreId,
      serviceCentreName,
      section,
      section.toLowerCase().replaceAll(' ', '-'),
      currentPage,
      SubjectType.SERVICE_CENTRE
    );
  }
}
