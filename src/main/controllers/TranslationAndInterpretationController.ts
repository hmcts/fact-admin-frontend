import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import {
  SaveTranslationAndInterpretationResult,
  TranslationAndInterpretationService,
  TranslationAndInterpretationViewModel,
} from '../services/TranslationAndInterpretationService';
import { isUuid } from '../utils/valueParsers';

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

    this.renderPageResult(res, await translationAndInterpretationService.getViewModel(courtId));
  }

  @route('/success')
  @POST()
  public async postSuccess(req: Request, res: Response): Promise<void> {
    await this.save(req, res);
  }

  private async save(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);

    if (!courtId) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const saveResponse = await translationAndInterpretationService.save(courtId, req.body);
    this.renderSaveResult(res, courtId, saveResponse);
  }

  private resolveCourtId(req: Request): string | null {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    return resolvedCourtId && isUuid(resolvedCourtId) ? resolvedCourtId : null;
  }

  private renderPageResult(res: Response, result: TranslationAndInterpretationViewModel | HttpStatusCode): void {
    if (result === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof result === 'number') {
      res.status(result);
      return res.render('error');
    }

    res.render('translation-and-interpretation', result);
  }

  private renderSaveResult(res: Response, courtId: string, result: SaveTranslationAndInterpretationResult): void {
    if (result === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof result === 'number') {
      res.status(result);
      return res.render('error');
    }

    if (result.status === 'validationError') {
      res.status(HttpStatusCode.BadRequest);
      return res.render('translation-and-interpretation', result.viewModel);
    }

    res.render('translation-and-interpretation-success', {
      courtId,
      courtName: result.viewModel.courtName,
    });
  }
}
