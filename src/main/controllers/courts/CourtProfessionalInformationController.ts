import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import {
  CourtProfessionalInformationService,
  FamilyCourtRemovalConfirmation,
} from '../../services/courts/CourtProfessionalInformationService';
import BaseController from '../BaseController';
import { buildSectionBreadcrumbs } from '../helpers/breadcrumbs';

type HiddenInput = {
  name: string;
  value: string;
};

@route('/courts/:courtId/edit/information-for-professionals')
export default class CourtProfessionalInformationController extends BaseController {
  public constructor(private readonly professionalInformationService = new CourtProfessionalInformationService()) {
    super();
  }

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    if (!courtId) {
      return this.renderCourtNotFound(res);
    }

    const viewModel = await this.professionalInformationService.getViewModel(courtId);
    if (this.renderStatusResponse(res, viewModel, 'court-not-found')) {
      return;
    }

    res.render('professional-information', {
      ...viewModel,
      breadcrumbs: this.buildProfessionalInformationBreadcrumbs(courtId, viewModel.courtName),
    });
  }

  @route('/success')
  @POST()
  public async postSuccess(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    if (!courtId) {
      return this.renderCourtNotFound(res);
    }

    if (req.body?.confirmFamilyCourtRemoval !== 'true') {
      const confirmation = await this.professionalInformationService.requiresFamilyCourtRemovalConfirmation(
        courtId,
        req.body
      );
      if (this.renderStatusResponse(res, confirmation, 'court-not-found')) {
        return;
      }

      if (confirmation.required) {
        return this.renderConfirmation(res, courtId, confirmation, req.body);
      }
    }

    const saveResponse = await this.professionalInformationService.save(courtId, req.body);
    if (this.renderStatusResponse(res, saveResponse, 'court-not-found')) {
      return;
    }

    if (saveResponse.status === 'validationError') {
      res.status(HttpStatusCode.BadRequest);
      return res.render('professional-information', {
        ...saveResponse.viewModel,
        breadcrumbs: this.buildProfessionalInformationBreadcrumbs(courtId, saveResponse.viewModel.courtName),
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
      cancelHref: `/courts/${courtId}/edit/information-for-professionals`,
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
