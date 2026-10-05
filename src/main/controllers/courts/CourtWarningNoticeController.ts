import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CourtWarningNoticeService, WarningNoticeForm } from '../../services/courts/CourtWarningNoticeService';
import { parseOptionalString } from '../../utils/valueParsers';
import BaseController from '../BaseController';

@route('/courts/:courtId/edit/warning-notice')
export default class CourtWarningNoticeController extends BaseController {
  constructor(private readonly warningNoticeService = new CourtWarningNoticeService()) {
    super();
  }

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    const viewModel = await this.warningNoticeService.getWarningNoticePage(courtId);

    return this.renderResponse(res, viewModel, 'court-warning-notice-edit', 'court-not-found');
  }

  @route('/success')
  @POST()
  public async post(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    const { warningNotice, warningNoticeCy } = req.body;
    const form: WarningNoticeForm = {
      warningNotice: parseOptionalString(warningNotice),
      warningNoticeCy: parseOptionalString(warningNoticeCy),
    };

    const saveResult = await this.warningNoticeService.save(courtId, form);

    if (saveResult.type === 'validation_error') {
      return res.status(HttpStatusCode.BadRequest).render('court-warning-notice-edit', {
        ...saveResult.viewModel,
      });
    }

    if (saveResult.type === 'status') {
      return this.renderStatus(res, saveResult.status, 'court-not-found');
    }

    const courtName = saveResult.viewModel.courtName;

    return res.render('common-edit-success.njk', {
      subjectId: saveResult.viewModel.courtId,
      subjectName: courtName,
      pageTitle: 'Warning notice saved',
      successPanelTitle: 'Warning notice saved',
      successPanelBody: `Warning notice for ${courtName} has been successfully updated.`,
      continueUpdatingHref: `/courts/${saveResult.viewModel.courtId}/edit/warning-notice`,
      continueUpdatingText: 'Back to warning notice',
    });
  }
}
