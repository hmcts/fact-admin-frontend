import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { isUuid } from '../utils/valueParsers';

@route('/service-centres/:serviceCentreId/edit')
export default class ServiceCentreEditController {
  @GET()
  public get(req: Request, res: Response): void {
    const { serviceCentreId } = req.params;
    const resolvedServiceCentreId = Array.isArray(serviceCentreId) ? serviceCentreId[0] : serviceCentreId;

    if (!resolvedServiceCentreId || !isUuid(resolvedServiceCentreId)) {
      res.status(HttpStatusCode.NotFound);
      res.render('not-found');
      return;
    }

    res.render('service-centre-edit', {
      pagePath: `/service-centres/${resolvedServiceCentreId}/edit`,
      pageTitle: 'Editing service centre',
      serviceCentreId: resolvedServiceCentreId,
    });
  }

  @GET()
  @route('/address')
  public getAddressPlaceholder(req: Request, res: Response): void {
    res.render('service-centre-address-placeholder', {
      pagePath: `/service-centres/${req.params.serviceCentreId}/edit/address`,
      pageTitle: 'Service centre address',
      serviceCentreId: req.params.serviceCentreId,
    });
  }
}
