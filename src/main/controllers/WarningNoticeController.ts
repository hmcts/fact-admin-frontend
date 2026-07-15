import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { WarningNoticeForm, WarningNoticeService } from '../services/WarningNoticeService';
import { renderResponse, renderStatus } from '../utils/responseRendering';
import { isUuid, parseOptionalString, parseString } from '../utils/valueParsers';

import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

const warningNoticeService = new WarningNoticeService();

@route('/courts/:courtId/edit/warning-notice')
export default class WarningNoticeController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const courtId: string = parseString(req.params.courtId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const viewModel = await warningNoticeService.getPage(courtId);

    return renderResponse(res, this.withBreadcrumbs(courtId, viewModel), 'court-warning-notice-edit');
  }

  @route('/success')
  @POST()
  public async post(req: Request, res: Response): Promise<void> {
    const courtId: string = parseString(req.params.courtId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const form: WarningNoticeForm = {
      warningNotice: parseOptionalString(req.body.warningNotice),
      warningNoticeCy: parseOptionalString(req.body.warningNoticeCy),
    };

    const saveResult = await warningNoticeService.save(courtId, form);

    if (saveResult.type === 'validation_error') {
      return res.status(HttpStatusCode.BadRequest).render('court-warning-notice-edit', {
        ...saveResult.viewModel,
        breadcrumbs: this.buildWarningNoticeBreadcrumbs(courtId, saveResult.viewModel.courtName),
      });
    }

    if (saveResult.type === 'status') {
      return renderStatus(res, saveResult.status, 'court-not-found');
    }

    return res.render('court-warning-notice-save-success', {
      ...saveResult.viewModel,
      breadcrumbs: this.buildWarningNoticeBreadcrumbs(courtId, saveResult.viewModel.courtName, 'Warning notice saved'),
    });
  }

  private buildWarningNoticeBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(courtId, courtName, 'Warning notice', 'warning-notice', currentPage);
  }

  private withBreadcrumbs<T extends { courtName: string }>(
    courtId: string,
    viewModel: T | HttpStatusCode,
    currentPage?: string
  ): T | HttpStatusCode {
    if (typeof viewModel === 'number') {
      return viewModel;
    }

    return {
      ...viewModel,
      breadcrumbs: this.buildWarningNoticeBreadcrumbs(courtId, viewModel.courtName, currentPage),
    };
  }

  private validateUuid(value: string, res: Response, template: string): boolean {
    if (!value || !isUuid(value)) {
      res.status(HttpStatusCode.NotFound);
      res.render(template);
      return false;
    }

    return true;
  }
}
