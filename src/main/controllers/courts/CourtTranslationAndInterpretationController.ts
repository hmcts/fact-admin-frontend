import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CourtTranslationAndInterpretationService } from '../../services/courts/CourtTranslationAndInterpretationService';
import BaseController from '../BaseController';

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

    return res.render('court-translation-and-interpretation', {
      ...viewModel,
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
      return res.render('court-translation-and-interpretation', {
        ...saveResponse.viewModel,
      });
    }

    return res.render('common-edit-success.njk', {
      subjectId: courtId,
      subjectName: saveResponse.viewModel.courtName,
      pageTitle: `Translation and interpretation saved - ${saveResponse.viewModel.courtName}`,
      successPanelTitle: 'Translation and interpretation saved',
      successPanelBody: `Translation and interpretation contact for ${saveResponse.viewModel.courtName} has been saved successfully.`,
    });
  }
}
