import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { getFactUserId, isSuperAdmin } from '../modules/authentication/authenticationHelper';
import { DataApiRequests } from '../requests/DataApiRequests';
import { ApprovalService, ApproveDataViewModel, EditApprovalAction } from '../services/ApprovalService';
import { isUuid } from '../utils/valueParsers';

const dataApiRequests = new DataApiRequests();
const approvalService = new ApprovalService(dataApiRequests);

@route('/courts/:courtId/edit')
export default class CourtEditController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const resolvedCourtId = this.resolveCourtId(req, res);

    if (!resolvedCourtId) {
      return;
    }

    const courtResponse = await dataApiRequests.getCourtById(resolvedCourtId);

    if (this.renderCourtResponseError(courtResponse, res)) {
      return;
    }

    const approvalAction = await approvalService.getEditApprovalAction(
      resolvedCourtId,
      'COURT',
      `/courts/${resolvedCourtId}/edit/approve`,
      isSuperAdmin(req)
    );

    if (this.renderStatusResponse(approvalAction, res)) {
      return;
    }

    res.render('court-edit', {
      ...approvalAction,
      courtId: resolvedCourtId,
      courtName: courtResponse.name,
      pagePath: `/courts/${resolvedCourtId}/edit`,
      pageTitle: `Editing - ${courtResponse.name}`,
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

    const resolvedCourtId = this.resolveCourtId(req, res);
    const userId = getFactUserId(req);

    if (!resolvedCourtId) {
      return;
    }

    if (!userId) {
      res.status(HttpStatusCode.InternalServerError);
      res.render('error');
      return;
    }

    const courtResponse = await dataApiRequests.getCourtById(resolvedCourtId);

    if (this.renderCourtResponseError(courtResponse, res)) {
      return;
    }

    const editPath = `/courts/${resolvedCourtId}/edit`;
    const approveData = await approvalService.approveData(
      resolvedCourtId,
      'COURT',
      courtResponse.name,
      editPath,
      userId
    );

    if (this.renderStatusResponse(approveData, res)) {
      return;
    }

    res.render('approval-success', {
      ...approveData,
      pagePath: `${approveData.editPath}/approve`,
      pageTitle: `Approval saved - ${courtResponse.name}`,
    });
  }

  private async getApproveData(
    req: Request,
    res: Response
  ): Promise<ApproveDataViewModel | HttpStatusCode | undefined> {
    const resolvedCourtId = this.resolveCourtId(req, res);

    if (!resolvedCourtId) {
      return undefined;
    }

    const courtResponse = await dataApiRequests.getCourtById(resolvedCourtId);

    if (typeof courtResponse === 'number') {
      return courtResponse;
    }

    return approvalService.getApproveData(
      resolvedCourtId,
      'COURT',
      courtResponse.name,
      `/courts/${resolvedCourtId}/edit`
    );
  }

  private resolveCourtId(req: Request, res: Response): string | undefined {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      res.render('court-not-found');
      return undefined;
    }

    return resolvedCourtId;
  }

  private renderCourtResponseError(
    courtResponse: Awaited<ReturnType<DataApiRequests['getCourtById']>>,
    res: Response
  ): courtResponse is HttpStatusCode {
    if (courtResponse === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      res.render('court-not-found');
      return true;
    }

    if (typeof courtResponse === 'number') {
      res.status(courtResponse);
      res.render('error');
      return true;
    }

    return false;
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
