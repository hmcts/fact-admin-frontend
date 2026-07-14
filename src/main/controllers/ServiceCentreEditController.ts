import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { DataApiRequests } from '../requests/DataApiRequests';
import { SubjectType } from '../schemas/subjectTypeSchema';
import { LockService } from '../services/LockService';
import { parseNumber } from '../utils/valueParsers';

import { buildServiceCentreEditBreadcrumbs } from './helpers/breadcrumbs';
import { renderError, renderServiceCentreNotFound } from './helpers/responseRenderers';
import { getUuidRouteParam } from './helpers/routeParams';

const dataApiRequests = new DataApiRequests();
const lockService = new LockService(dataApiRequests);

@route('/service-centres/:serviceCentreId/edit')
export default class ServiceCentreEditController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const resolvedServiceCentreId = getUuidRouteParam(req, 'serviceCentreId');
    if (!resolvedServiceCentreId) {
      renderServiceCentreNotFound(res);
      return;
    }

    const serviceCentreResponse = await dataApiRequests.getServiceCentreById(resolvedServiceCentreId);
    if (serviceCentreResponse === HttpStatusCode.NotFound) {
      renderServiceCentreNotFound(res);
      return;
    }

    if (typeof serviceCentreResponse === 'number') {
      renderError(res, serviceCentreResponse);
      return;
    }

    const serviceCentreLocks = await lockService.getLocks(SubjectType.SERVICE_CENTRE, resolvedServiceCentreId);

    if (typeof serviceCentreLocks === 'number') {
      res.status(serviceCentreLocks);
      res.render('error');
      return;
    }

    res.render('service-centre-edit', {
      breadcrumbs: buildServiceCentreEditBreadcrumbs(resolvedServiceCentreId, serviceCentreResponse.name),
      pagePath: `/service-centres/${resolvedServiceCentreId}/edit`,
      pageTitle: `Editing - ${serviceCentreResponse.name}`,
      serviceCentreName: serviceCentreResponse.name,
      serviceCentreId: resolvedServiceCentreId,
      serviceCentreLocks,
      timeoutMins: this.getTimeoutMinsFromQuery(req.query),
    });
  }

  private getTimeoutMinsFromQuery(query: Request['query']): number | undefined {
    const timeoutMins = parseNumber(query?.timeout, -1);
    return timeoutMins === -1 ? undefined : timeoutMins;
  }
}
