import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { ProfessionalInformationService } from '../services/ProfessionalInformationService';
import { isUuid } from '../utils/valueParsers';

const professionalInformationService = new ProfessionalInformationService();

@route('/courts/:courtId/edit/information-for-professionals')
export default class ProfessionalInformationController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);
    if (!courtId) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const viewModel = await professionalInformationService.getViewModel(courtId);

    if (viewModel === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof viewModel === 'number') {
      res.status(viewModel);
      return res.render('error');
    }

    res.render('professional-information', viewModel);
  }

  @route('/success')
  @POST()
  public async postSuccess(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);
    if (!courtId) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (req.body?.confirmFamilyCourtRemoval !== 'true') {
      const confirmation = await professionalInformationService.requiresFamilyCourtRemovalConfirmation(
        courtId,
        req.body
      );
      if (confirmation === HttpStatusCode.NotFound) {
        res.status(HttpStatusCode.NotFound);
        return res.render('court-not-found');
      }

      if (typeof confirmation === 'number') {
        res.status(confirmation);
        return res.render('error');
      }

      if (confirmation.required) {
        return res.render('professional-information-confirm', {
          courtId,
          courtName: confirmation.courtName,
          hiddenInputs: this.buildHiddenInputs(req.body),
          message:
            'You are removing the court type of Family court. This is being used by the local authorities admin page. If you remove this it will remove the local authority config. Do you want to remove this?',
        });
      }
    }

    const saveResponse = await professionalInformationService.save(courtId, req.body);

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
      return res.render('professional-information', saveResponse.viewModel);
    }

    res.render('professional-information-success', {
      courtId,
      courtName: saveResponse.viewModel.courtName,
    });
  }

  private resolveCourtId(req: Request): string | null {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    return resolvedCourtId && isUuid(resolvedCourtId) ? resolvedCourtId : null;
  }

  private buildHiddenInputs(body: Request['body']): { name: string; value: string }[] {
    if (!body || typeof body !== 'object') {
      return [{ name: 'confirmFamilyCourtRemoval', value: 'true' }];
    }

    const hiddenInputs = Object.entries(body)
      .filter(([name]) => name !== 'confirmFamilyCourtRemoval')
      .flatMap(([name, value]) =>
        [value]
          .flat()
          .filter((entry): entry is string => typeof entry === 'string')
          .map(entry => ({
            name,
            value: entry,
          }))
      );

    return [...hiddenInputs, { name: 'confirmFamilyCourtRemoval', value: 'true' }];
  }
}
