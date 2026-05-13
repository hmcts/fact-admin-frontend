import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { TranslationAndInterpretationService } from '../services/TranslationAndInterpretationService';
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

    const viewModel = await translationAndInterpretationService.getViewModel(courtId);

    if (viewModel === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof viewModel === 'number') {
      res.status(viewModel);
      return res.render('error');
    }

    res.render('translation-and-interpretation', viewModel);
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
      return res.render('translation-and-interpretation', saveResponse.viewModel);
    }

    res.render('translation-and-interpretation-success', {
      courtId,
      courtName: saveResponse.viewModel.courtName,
    });
  }

  private resolveCourtId(req: Request): string | null {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    return resolvedCourtId && isUuid(resolvedCourtId) ? resolvedCourtId : null;
  }
}
