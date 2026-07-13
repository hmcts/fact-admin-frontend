import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { canApprove, getFactUserId, isViewer } from '../modules/authentication/authenticationHelper';
import { ApprovalSubjectType } from '../schemas/approvalSchema';
import { ApprovalService, ApproveDataViewModel, EditApprovalAction } from '../services/ApprovalService';
import { isUuid } from '../utils/valueParsers';

import { BreadcrumbItem } from './helpers/breadcrumbs';

type Location = {
  name: string;
};

type LocationApprovalControllerOptions = {
  buildBreadcrumbs?: (locationId: string, locationName: string) => BreadcrumbItem[];
  editView: string;
  getLocation: (locationId: string) => Promise<Location | HttpStatusCode>;
  locationIdViewKey: string;
  locationNameViewKey: string;
  notFoundView: string;
  paramName: string;
  routeSegment: string;
  subjectType: ApprovalSubjectType;
};

export class LocationApprovalController {
  public constructor(
    private readonly options: LocationApprovalControllerOptions,
    private readonly approvalService: ApprovalService
  ) {}

  public async get(req: Request, res: Response): Promise<void> {
    const locationId = this.resolveLocationId(req, res);

    if (!locationId) {
      return;
    }

    const location = await this.options.getLocation(locationId);

    if (this.renderLocationResponseError(location, res)) {
      return;
    }

    const editPath = this.getEditPath(locationId);
    const approvalAction = await this.approvalService.getEditApprovalAction(
      locationId,
      this.options.subjectType,
      `${editPath}/approve`,
      canApprove(req)
    );

    if (this.renderStatusResponse(approvalAction, res)) {
      return;
    }

    res.render(this.options.editView, {
      ...approvalAction,
      ...(this.options.buildBreadcrumbs
        ? { breadcrumbs: this.options.buildBreadcrumbs(locationId, location.name) }
        : {}),
      [this.options.locationIdViewKey]: locationId,
      [this.options.locationNameViewKey]: location.name,
      pagePath: editPath,
      pageTitle: `${isViewer(req) ? 'Reviewing' : 'Editing'} - ${location.name}`,
    });
  }

  public async getApprove(req: Request, res: Response): Promise<void> {
    if (!this.requireCanApprove(req, res)) {
      return;
    }

    const approveData = await this.getApproveData(req, res);

    if (!approveData || this.renderStatusResponse(approveData, res)) {
      return;
    }

    res.render('approval-confirm', {
      ...approveData,
      pagePath: `${approveData.editPath}/approve`,
    });
  }

  public async postApprove(req: Request, res: Response): Promise<void> {
    if (!this.requireCanApprove(req, res)) {
      return;
    }

    const locationId = this.resolveLocationId(req, res);
    const userId = getFactUserId(req);

    if (!locationId) {
      return;
    }

    if (!userId) {
      res.status(HttpStatusCode.InternalServerError);
      res.render('error');
      return;
    }

    const location = await this.options.getLocation(locationId);

    if (this.renderLocationResponseError(location, res)) {
      return;
    }

    const approveData = await this.approvalService.approveData(
      locationId,
      this.options.subjectType,
      location.name,
      this.getEditPath(locationId),
      userId
    );

    if (this.renderStatusResponse(approveData, res)) {
      return;
    }

    res.render('approval-success', {
      ...approveData,
      pagePath: `${approveData.editPath}/approve`,
      pageTitle: `Approval saved - ${location.name}`,
    });
  }

  private async getApproveData(
    req: Request,
    res: Response
  ): Promise<ApproveDataViewModel | HttpStatusCode | undefined> {
    const locationId = this.resolveLocationId(req, res);

    if (!locationId) {
      return undefined;
    }

    const location = await this.options.getLocation(locationId);

    if (typeof location === 'number') {
      return location;
    }

    return this.approvalService.getApproveData(
      locationId,
      this.options.subjectType,
      location.name,
      this.getEditPath(locationId)
    );
  }

  private getEditPath(locationId: string): string {
    return `/${this.options.routeSegment}/${locationId}/edit`;
  }

  private renderLocationResponseError(location: Location | HttpStatusCode, res: Response): location is HttpStatusCode {
    if (typeof location !== 'number') {
      return false;
    }

    res.status(location);
    res.render(location === HttpStatusCode.NotFound ? this.options.notFoundView : 'error');
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

  private requireCanApprove(req: Request, res: Response): boolean {
    if (canApprove(req)) {
      return true;
    }

    res.status(HttpStatusCode.Forbidden);
    res.render('access-denied');
    return false;
  }

  private resolveLocationId(req: Request, res: Response): string | undefined {
    const locationIdParam = req.params[this.options.paramName];
    const locationId = Array.isArray(locationIdParam) ? locationIdParam[0] : locationIdParam;

    if (!locationId || !isUuid(locationId)) {
      res.status(HttpStatusCode.NotFound);
      res.render(this.options.notFoundView);
      return undefined;
    }

    return locationId;
  }
}
