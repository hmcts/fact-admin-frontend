import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { isSuperAdmin } from '../modules/authentication/authenticationHelper';
import { ApprovalService, ApprovalTrackerViewModel, UndoApprovalViewModel } from '../services/ApprovalService';
import { isUuid, parseString } from '../utils/valueParsers';

import { buildPageBreadcrumbs } from './helpers/breadcrumbs';

@route('/approvals')
export default class ApprovalsController {
  constructor(private readonly approvalService = new ApprovalService()) {}

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const viewModel = await this.approvalService.getApprovalsTracker({
      name: parseString(req.query?.name),
      status: parseString(req.query?.status),
    });

    if (this.renderStatusResponse(res, viewModel)) {
      return;
    }

    return res.render('approvals', {
      ...viewModel,
      breadcrumbs: buildPageBreadcrumbs('Approvals tracker'),
    });
  }

  @route('/:approvalId/undo')
  @GET()
  public async getUndoApproval(req: Request, res: Response): Promise<void> {
    if (!this.requireSuperAdmin(req, res)) {
      return;
    }

    const approvalId = this.resolveApprovalId(req, res);
    if (!approvalId) {
      return;
    }

    const viewModel = await this.approvalService.getUndoApproval(approvalId);

    if (this.renderStatusResponse(res, viewModel)) {
      return;
    }

    return res.render('approval-undo-confirm', {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: '/approvals', text: 'Approvals tracker' },
        { href: '#', text: 'Undo approval' },
      ],
    });
  }

  @route('/:approvalId/undo')
  @POST()
  public async postUndoApproval(req: Request, res: Response): Promise<void> {
    if (!this.requireSuperAdmin(req, res)) {
      return;
    }

    const approvalId = this.resolveApprovalId(req, res);
    if (!approvalId) {
      return;
    }

    const viewModel = await this.approvalService.undoApproval(approvalId);

    if (this.renderStatusResponse(res, viewModel)) {
      return;
    }

    return res.render('common-edit-success', {
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: '/approvals', text: 'Approvals tracker' },
        { href: '#', text: 'Approval undone' },
      ],
      continueUpdatingHref: '/approvals',
      continueUpdatingText: 'Back to Approval tracker',
      homeText: 'Back to Courts, tribunals and service centres list',
      pageTitle: `Approval undone - ${viewModel.name}`,
      successPanelBody: `You have undone the data approval for ${viewModel.name}.`,
      successPanelTitle: 'Approval undone',
    });
  }

  private renderStatusResponse(
    res: Response,
    result: ApprovalTrackerViewModel | UndoApprovalViewModel | HttpStatusCode
  ): result is HttpStatusCode {
    if (typeof result !== 'number') {
      return false;
    }

    res.status(result).render('error');
    return true;
  }

  private requireSuperAdmin(req: Request, res: Response): boolean {
    if (isSuperAdmin(req)) {
      return true;
    }

    res.status(HttpStatusCode.Forbidden).render('access-denied');
    return false;
  }

  private resolveApprovalId(req: Request, res: Response): string | undefined {
    const approvalId = parseString(req.params?.approvalId);

    if (isUuid(approvalId)) {
      return approvalId;
    }

    res.status(HttpStatusCode.NotFound).render('not-found');
    return undefined;
  }
}
