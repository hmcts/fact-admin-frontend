import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { getFactUserId, isSuperAdmin } from '../modules/authentication/authenticationHelper';
import { DataApiRequests } from '../requests/DataApiRequests';
import { ApprovalService, ApproveDataViewModel, EditApprovalAction } from '../services/ApprovalService';
import { isUuid } from '../utils/valueParsers';

const dataApiRequests = new DataApiRequests();
const approvalService = new ApprovalService(dataApiRequests);

@route('/service-centres/:serviceCentreId/edit')
export default class ServiceCentreEditController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const resolvedServiceCentreId = this.resolveServiceCentreId(req, res);

    if (!resolvedServiceCentreId) {
      return;
    }

    const serviceCentreResponse = await dataApiRequests.getServiceCentreById(resolvedServiceCentreId);

    if (this.renderServiceCentreResponseError(serviceCentreResponse, res)) {
      return;
    }

    const approvalAction = await approvalService.getEditApprovalAction(
      resolvedServiceCentreId,
      'SERVICE_CENTRE',
      `/service-centres/${resolvedServiceCentreId}/edit/approve`,
      isSuperAdmin(req)
    );

    if (this.renderStatusResponse(approvalAction, res)) {
      return;
    }

    res.render('service-centre-edit', {
      ...approvalAction,
      pagePath: `/service-centres/${resolvedServiceCentreId}/edit`,
      pageTitle: `Editing - ${serviceCentreResponse.name}`,
      serviceCentreId: resolvedServiceCentreId,
      serviceCentreName: serviceCentreResponse.name,
    });
  }

  @GET()
  @route('/approve')
  public async getApprove(req: Request, res: Response): Promise<void> {
    if (!this.requireSuperAdmin(req, res)) {
      return;
    }

    const approveData = await this.getApproveData(req, res);

    if (!approveData) {
      return;
    }

    if (this.renderStatusResponse(approveData, res)) {
      return;
    }

    res.render('approval-confirm', {
      ...approveData,
      pagePath: `${approveData.editPath}/approve`,
    });
  }

  @POST()
  @route('/approve')
  public async postApprove(req: Request, res: Response): Promise<void> {
    if (!this.requireSuperAdmin(req, res)) {
      return;
    }

    const resolvedServiceCentreId = this.resolveServiceCentreId(req, res);
    const userId = getFactUserId(req);

    if (!resolvedServiceCentreId) {
      return;
    }

    if (!userId) {
      res.status(HttpStatusCode.InternalServerError);
      res.render('error');
      return;
    }

    const serviceCentreResponse = await dataApiRequests.getServiceCentreById(resolvedServiceCentreId);

    if (this.renderServiceCentreResponseError(serviceCentreResponse, res)) {
      return;
    }

    const editPath = `/service-centres/${resolvedServiceCentreId}/edit`;
    const approveData = await approvalService.approveData(
      resolvedServiceCentreId,
      'SERVICE_CENTRE',
      serviceCentreResponse.name,
      editPath,
      userId
    );

    if (this.renderStatusResponse(approveData, res)) {
      return;
    }

    res.render('approval-success', {
      ...approveData,
      pagePath: `${approveData.editPath}/approve`,
      pageTitle: `Approval saved - ${serviceCentreResponse.name}`,
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

  private async getApproveData(
    req: Request,
    res: Response
  ): Promise<ApproveDataViewModel | HttpStatusCode | undefined> {
    const resolvedServiceCentreId = this.resolveServiceCentreId(req, res);

    if (!resolvedServiceCentreId) {
      return undefined;
    }

    const serviceCentreResponse = await dataApiRequests.getServiceCentreById(resolvedServiceCentreId);

    if (typeof serviceCentreResponse === 'number') {
      return serviceCentreResponse;
    }

    return approvalService.getApproveData(
      resolvedServiceCentreId,
      'SERVICE_CENTRE',
      serviceCentreResponse.name,
      `/service-centres/${resolvedServiceCentreId}/edit`
    );
  }

  private resolveServiceCentreId(req: Request, res: Response): string | undefined {
    const { serviceCentreId } = req.params;
    const resolvedServiceCentreId = Array.isArray(serviceCentreId) ? serviceCentreId[0] : serviceCentreId;

    if (!resolvedServiceCentreId || !isUuid(resolvedServiceCentreId)) {
      res.status(HttpStatusCode.NotFound);
      res.render('not-found');
      return undefined;
    }

    return resolvedServiceCentreId;
  }

  private renderServiceCentreResponseError(
    serviceCentreResponse: Awaited<ReturnType<DataApiRequests['getServiceCentreById']>>,
    res: Response
  ): serviceCentreResponse is HttpStatusCode {
    if (typeof serviceCentreResponse !== 'number') {
      return false;
    }

    res.status(serviceCentreResponse);
    res.render(serviceCentreResponse === HttpStatusCode.NotFound ? 'not-found' : 'error');
    return true;
  }

  private renderStatusResponse(
    response: ApproveDataViewModel | EditApprovalAction | HttpStatusCode,
    res: Response
  ): response is HttpStatusCode {
    if (typeof response !== 'number') {
      return false;
    }

    res.status(response);
    res.render(response === HttpStatusCode.NotFound ? 'not-found' : 'error');
    return true;
  }

  private requireSuperAdmin(req: Request, res: Response): boolean {
    if (isSuperAdmin(req)) {
      return true;
    }

    res.status(HttpStatusCode.Forbidden);
    res.render('access-denied');
    return false;
  }
}
