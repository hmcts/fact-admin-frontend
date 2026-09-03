import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CourtTranslationAndInterpretationService } from '../../services/courts/CourtTranslationAndInterpretationService';
import BaseController from '../BaseController';
import { buildSectionBreadcrumbs } from '../helpers/breadcrumbs';

@route('/courts/:courtId/edit/translation-and-interpretation')
export default class CourtTranslationAndInterpretationController extends BaseController {
  constructor(private readonly translationAndInterpretationService = new CourtTranslationAndInterpretationService()) {
    super();
  }

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');

    if (!courtId) {
      return this.renderCourtNotFound(res);
    }

    const viewModel = await this.translationAndInterpretationService.getViewModel(courtId);

    if (this.renderStatusResponse(res, viewModel, 'court-not-found')) {
      return;
    }

    return res.render('translation-and-interpretation', {
      ...viewModel,
      breadcrumbs: this.buildTranslationBreadcrumbs(courtId, viewModel.courtName),
    });
  }

  @route('/success')
  @POST()
  public async postSuccess(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');

    if (!courtId) {
      return this.renderCourtNotFound(res);
    }

    const saveResponse = await this.translationAndInterpretationService.save(courtId, req.body);

    if (this.renderStatusResponse(res, saveResponse, 'court-not-found')) {
      return;
    }

    if (saveResponse.status === 'validationError') {
      res.status(HttpStatusCode.BadRequest);
      return res.render('translation-and-interpretation', {
        ...saveResponse.viewModel,
        breadcrumbs: this.buildTranslationBreadcrumbs(courtId, saveResponse.viewModel.courtName),
      });
    }

    return res.render('translation-and-interpretation-success', {
      breadcrumbs: this.buildTranslationBreadcrumbs(
        courtId,
        saveResponse.viewModel.courtName,
        'Translation and interpretation saved'
      ),
      courtId,
      courtName: saveResponse.viewModel.courtName,
    });
  }

  private buildTranslationBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(
      courtId,
      courtName,
      'Translation and interpretation',
      'translation-and-interpretation',
      currentPage
    );
  }
}
