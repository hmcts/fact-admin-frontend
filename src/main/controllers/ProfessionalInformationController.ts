import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import {
  FamilyCourtRemovalConfirmation,
  ProfessionalInformationService,
  ProfessionalInformationViewModel,
  SaveProfessionalInformationResult,
} from '../services/ProfessionalInformationService';
import { isUuid } from '../utils/valueParsers';

type HiddenInput = {
  name: string;
  value: string;
};

@route('/courts/:courtId/edit/information-for-professionals')
export default class ProfessionalInformationController {
  private readonly professionalInformationService: ProfessionalInformationService;

  public constructor(professionalInformationService?: ProfessionalInformationService) {
    this.professionalInformationService = professionalInformationService ?? new ProfessionalInformationService();
  }

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);
    if (!courtId) {
      return this.renderCourtNotFound(res);
    }

    const viewModel = await this.professionalInformationService.getViewModel(courtId);
    if (this.renderStatusResponse(res, viewModel)) {
      return;
    }

    res.render('professional-information', viewModel);
  }

  @route('/success')
  @POST()
  public async postSuccess(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);
    if (!courtId) {
      return this.renderCourtNotFound(res);
    }

    if (req.body?.confirmFamilyCourtRemoval !== 'true') {
      const confirmation = await this.professionalInformationService.requiresFamilyCourtRemovalConfirmation(
        courtId,
        req.body
      );
      if (this.renderStatusResponse(res, confirmation)) {
        return;
      }

      if (confirmation.required) {
        return this.renderConfirmation(res, courtId, confirmation, req.body);
      }
    }

    const saveResponse = await this.professionalInformationService.save(courtId, req.body);
    if (this.renderStatusResponse(res, saveResponse)) {
      return;
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
    const courtId = req.params?.courtId as string | string[] | undefined;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    return typeof resolvedCourtId === 'string' && isUuid(resolvedCourtId) ? resolvedCourtId : null;
  }

  private renderStatusResponse(
    res: Response,
    response:
      | FamilyCourtRemovalConfirmation
      | HttpStatusCode
      | ProfessionalInformationViewModel
      | SaveProfessionalInformationResult
  ): response is HttpStatusCode {
    if (typeof response !== 'number') {
      return false;
    }

    if (response === HttpStatusCode.NotFound) {
      this.renderCourtNotFound(res);
      return true;
    }

    res.status(response);
    res.render('error');
    return true;
  }

  private renderCourtNotFound(res: Response): void {
    res.status(HttpStatusCode.NotFound);
    res.render('court-not-found');
  }

  private renderConfirmation(
    res: Response,
    courtId: string,
    confirmation: FamilyCourtRemovalConfirmation,
    body: Request['body']
  ): void {
    res.render('professional-information-confirm', {
      courtId,
      courtName: confirmation.courtName,
      hiddenInputs: this.buildHiddenInputs(body),
      message:
        'You are removing the court type of Family court. This is being used by the local authorities admin page. If you remove this it will remove the local authority config. Do you want to remove this?',
    });
  }

  private buildHiddenInputs(body: Request['body']): HiddenInput[] {
    const confirmationInput = { name: 'confirmFamilyCourtRemoval', value: 'true' };

    if (!body || typeof body !== 'object') {
      return [confirmationInput];
    }

    const hiddenInputs = Object.entries(body)
      .filter(([name]) => name !== 'confirmFamilyCourtRemoval')
      .flatMap(([name, value]) => this.toHiddenInputs(name, value));

    return [...hiddenInputs, confirmationInput];
  }

  private toHiddenInputs(name: string, value: unknown): HiddenInput[] {
    if (typeof value === 'string') {
      return [{ name, value }];
    }

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map(entry => ({
        name,
        value: entry,
      }));
  }
}
