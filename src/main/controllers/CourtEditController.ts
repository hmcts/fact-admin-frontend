import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';

import { DataApiRequests } from '../requests/DataApiRequests';
import { ApprovalService } from '../services/ApprovalService';

import { LocationApprovalController } from './LocationApprovalController';
import { buildEditBreadcrumbs } from './helpers/breadcrumbs';

const dataApiRequests = new DataApiRequests();
const locationApprovalController = new LocationApprovalController(
  {
    buildBreadcrumbs: buildEditBreadcrumbs,
    editView: 'court-edit',
    getLocation: courtId => dataApiRequests.getCourtById(courtId),
    locationIdViewKey: 'courtId',
    locationNameViewKey: 'courtName',
    notFoundView: 'court-not-found',
    paramName: 'courtId',
    routeSegment: 'courts',
    subjectType: 'COURT',
  },
  new ApprovalService(dataApiRequests)
);

@route('/courts/:courtId/edit')
export default class CourtEditController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    await locationApprovalController.get(req, res);
  }

  @GET()
  @route('/approve')
  public async getApprove(req: Request, res: Response): Promise<void> {
    await locationApprovalController.getApprove(req, res);
  }

  @POST()
  @route('/approve')
  public async postApprove(req: Request, res: Response): Promise<void> {
    await locationApprovalController.postApprove(req, res);
  }
}
