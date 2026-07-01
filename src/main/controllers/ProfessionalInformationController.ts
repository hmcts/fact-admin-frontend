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

import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

type HiddenInput = {
  name: string;
  value: string;
};

type ProfessionalInformationServiceFactory = () => Promise<ProfessionalInformationService>;

@route('/courts/:courtId/edit/information-for-professionals')
export default class ProfessionalInformationController {
  private professionalInformationService?: ProfessionalInformationService;
  private readonly professionalInformationServiceFactory?: ProfessionalInformationServiceFactory;

  public constructor(
    professionalInformationServiceFactory?: ProfessionalInformationService | ProfessionalInformationServiceFactory
  ) {
    if (typeof professionalInformationServiceFactory === 'function') {
      this.professionalInformationServiceFactory = professionalInformationServiceFactory;
    } else {
      this.professionalInformationService =
        professionalInformationServiceFactory ?? new ProfessionalInformationService();
    }
  }

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);
    if (!courtId) {
      return this.renderCourtNotFound(res);
    }

    const professionalInformationService = await this.getProfessionalInformationService();
    const viewModel = await professionalInformationService.getViewModel(courtId);
    if (this.renderStatusResponse(res, viewModel)) {
      return;
    }

    res.render('professional-information', {
      ...viewModel,
      breadcrumbs: this.buildProfessionalInformationBreadcrumbs(courtId, viewModel.courtName ?? 'Court'),
    });
  }

  @route('/success')
  @POST()
  public async postSuccess(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveCourtId(req);
    if (!courtId) {
      return this.renderCourtNotFound(res);
    }

    if (req.body?.confirmFamilyCourtRemoval !== 'true') {
      const professionalInformationService = await this.getProfessionalInformationService();
      const confirmation = await professionalInformationService.requiresFamilyCourtRemovalConfirmation(
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

    const professionalInformationService = await this.getProfessionalInformationService();
    const saveResponse = await professionalInformationService.save(courtId, req.body);
    if (this.renderStatusResponse(res, saveResponse)) {
      return;
    }

    if (saveResponse.status === 'validationError') {
      res.status(HttpStatusCode.BadRequest);
      return res.render('professional-information', {
        ...saveResponse.viewModel,
        breadcrumbs: this.buildProfessionalInformationBreadcrumbs(courtId, saveResponse.viewModel.courtName ?? 'Court'),
      });
    }

    res.render('professional-information-success', {
      breadcrumbs: this.buildProfessionalInformationBreadcrumbs(
        courtId,
        saveResponse.viewModel.courtName,
        'Information for professionals saved'
      ),
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
      breadcrumbs: this.buildProfessionalInformationBreadcrumbs(
        courtId,
        confirmation.courtName,
        'Information for professionals confirm update'
      ),
      courtId,
      courtName: confirmation.courtName,
      hiddenInputs: this.buildHiddenInputs(body),
      message:
        'You are removing the court type of Family court. This is being used by the local authorities admin page. If you remove this it will remove the local authority config. Do you want to remove this?',
    });
  }

  private async getProfessionalInformationService(): Promise<ProfessionalInformationService> {
    if (!this.professionalInformationService) {
      this.professionalInformationService = this.professionalInformationServiceFactory
        ? await this.professionalInformationServiceFactory()
        : new ProfessionalInformationService();
    }

    return this.professionalInformationService;
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

  private buildProfessionalInformationBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(
      courtId,
      courtName,
      'Information for professionals',
      'information-for-professionals',
      currentPage
    );
  }
}
