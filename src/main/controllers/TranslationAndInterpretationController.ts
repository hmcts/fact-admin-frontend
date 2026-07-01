import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { TranslationAndInterpretationService } from '../services/TranslationAndInterpretationService';
import { isUuid } from '../utils/valueParsers';

import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

const translationAndInterpretationService = new TranslationAndInterpretationService();

@route('/courts/:courtId/edit/translation-and-interpretation')
export default class TranslationAndInterpretationController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);

    if (!courtId) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const viewModel = await translationAndInterpretationService.getViewModel(courtId);

    if (viewModel === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof viewModel === 'number') {
      res.status(viewModel);
      return res.render('error');
    }

    res.render('translation-and-interpretation', {
      ...viewModel,
      breadcrumbs: this.buildTranslationBreadcrumbs(courtId, viewModel.courtName ?? 'Court'),
    });
  }

  @route('/success')
  @POST()
  public async postSuccess(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);

    if (!courtId) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const saveResponse = await translationAndInterpretationService.save(courtId, req.body);

    if (saveResponse === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof saveResponse === 'number') {
      res.status(saveResponse);
      return res.render('error');
    }

    if (saveResponse.status === 'validationError') {
      res.status(HttpStatusCode.BadRequest);
      return res.render('translation-and-interpretation', {
        ...saveResponse.viewModel,
        breadcrumbs: this.buildTranslationBreadcrumbs(courtId, saveResponse.viewModel.courtName ?? 'Court'),
      });
    }

    res.render('translation-and-interpretation-success', {
      breadcrumbs: this.buildTranslationBreadcrumbs(
        courtId,
        saveResponse.viewModel.courtName,
        'Translation and interpretation saved'
      ),
      courtId,
      courtName: saveResponse.viewModel.courtName,
    });
  }

  private resolveCourtId(req: Request): string | null {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    return resolvedCourtId && isUuid(resolvedCourtId) ? resolvedCourtId : null;
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
