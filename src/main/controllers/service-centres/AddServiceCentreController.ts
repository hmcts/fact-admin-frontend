import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';

import { AddServiceCentreService } from '../../services/service-centres/AddServiceCentreService';
import BaseController from '../BaseController';
import { buildPageBreadcrumbs } from '../helpers/breadcrumbs';

@route('/add-service-centre')
export default class AddServiceCentreController extends BaseController {
  constructor(private readonly addServiceCentreService = new AddServiceCentreService()) {
    super();
  }

  @GET()
  public async get(_req: Request, res: Response): Promise<void> {
    const viewModel = await this.addServiceCentreService.getViewModel();

    if (typeof viewModel === 'number') {
      this.renderError(res, viewModel);
      return;
    }

    res.render('add-service-centre', {
      ...viewModel,
      breadcrumbs: buildPageBreadcrumbs('Add new service centre'),
    });
  }

  @POST()
  public async createServiceCentre(req: Request, res: Response): Promise<void> {
    const createResult = await this.addServiceCentreService.create({
      name: req.body?.name ?? undefined,
      regionId: req.body?.regionId ?? undefined,
      serviceAreaIds: this.getSelectedServiceAreaIds(req.body?.serviceAreaIds),
    });

    if (typeof createResult === 'number') {
      this.renderError(res, createResult);
      return;
    }

    if (!('serviceCentreId' in createResult)) {
      res.render('add-service-centre', {
        ...createResult,
        breadcrumbs: buildPageBreadcrumbs('Add new service centre'),
      });
      return;
    }

    res.render('add-service-centre-success', {
      ...createResult,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        {
          href: `/service-centres/${createResult.serviceCentreId}/edit`,
          text: createResult.serviceCentreName,
        },
        { href: '#', text: 'Addresses' },
      ],
    });
  }

  private getSelectedServiceAreaIds(serviceAreaIds: unknown): string[] {
    if (Array.isArray(serviceAreaIds)) {
      return serviceAreaIds.map(String);
    }

    if (typeof serviceAreaIds === 'string' && serviceAreaIds.length > 0) {
      return [serviceAreaIds];
    }

    return [];
  }
}
