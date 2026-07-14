import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';

import { DataApiRequests } from '../requests/DataApiRequests';
import { ApprovalService } from '../services/ApprovalService';

import { LocationApprovalController } from './LocationApprovalController';

const dataApiRequests = new DataApiRequests();
const locationApprovalController = new LocationApprovalController(
  {
    editView: 'service-centre-edit',
    getLocation: serviceCentreId => dataApiRequests.getServiceCentreById(serviceCentreId),
    locationIdViewKey: 'serviceCentreId',
    locationNameViewKey: 'serviceCentreName',
    notFoundView: 'not-found',
    paramName: 'serviceCentreId',
    routeSegment: 'service-centres',
    subjectType: 'SERVICE_CENTRE',
  },
  new ApprovalService(dataApiRequests)
);

@route('/service-centres/:serviceCentreId/edit')
export default class ServiceCentreEditController {
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
