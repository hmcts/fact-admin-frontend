import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { SubjectType } from '../schemas/subjectTypeSchema';
import { ServiceCentreGeneralService } from '../services/ServiceCentreGeneralService';

import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';
import { renderError, renderServiceCentreNotFound } from './helpers/responseRenderers';
import { getUuidRouteParam } from './helpers/routeParams';

const serviceCentreGeneralService = new ServiceCentreGeneralService();

@route('/service-centres/:serviceCentreId/edit/general')
export default class ServiceCentreGeneralController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const serviceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!serviceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const viewModel = await serviceCentreGeneralService.retrieve(serviceCentreId);
    if (viewModel === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }
    if (typeof viewModel === 'number') {
      renderError(res, viewModel);
      return;
    }

    res.render('service-centre-general-edit', {
      breadcrumbs: this.buildSectionBreadcrumbs(serviceCentreId, viewModel.name!, 'General'),
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

    const saveResult = await serviceCentreGeneralService.save({
      id: serviceCentreId,
      name: req.body?.name,
      open: this.parseOpen(req.body?.open),
      serviceAreaIds: this.parseSelectedServiceAreaIds(req.body?.serviceAreaIds),
      regionId: req.body?.regionId,
    });

    if (saveResult.type === 'validation-error') {
      res.status(HttpStatusCode.BadRequest);
      res.render('service-centre-general-edit', {
        breadcrumbs: this.buildSectionBreadcrumbs(serviceCentreId, saveResult.viewModel.name!, 'General'),
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
      breadcrumbs: this.buildSectionBreadcrumbs(
        serviceCentreId,
        saveResult.viewModel.name!,
        'General',
        'General saved'
      ),
      continueUpdatingHref: `/service-centres/${serviceCentreId}/edit`,
      continueUpdatingText: `Continue updating ${saveResult.viewModel.name}`,
      courtId: serviceCentreId,
      courtName: saveResult.viewModel.name,
      pageTitle: `General saved - ${saveResult.viewModel.name}`,
      successPanelBody: `General details for ${saveResult.viewModel.name} have been saved successfully.`,
      successPanelTitle: 'General details saved',
    });
  }

  private parseOpen(open: unknown): boolean | undefined {
    if (open === 'true' || open === true) {
      return true;
    }
    if (open === 'false' || open === false) {
      return false;
    }
    return undefined;
  }

  private parseSelectedServiceAreaIds(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((selectedValue): selectedValue is string => typeof selectedValue === 'string');
    }

    if (typeof value === 'string' && value.length > 0) {
      return [value];
    }

    return [];
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
