import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CourtOpeningHoursService, OpeningHoursForm } from '../services/CourtOpeningHoursService';
import { renderResponse, renderStatus } from '../utils/responseRendering';
import { isUuid, parseOptionalString, parseString } from '../utils/valueParsers';

import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

const courtOpeningHoursService = new CourtOpeningHoursService();

@route('/courts/:courtId/edit/court-opening-hours')
export default class CourtOpeningHoursController {
  @GET()
  public async getList(req: Request, res: Response): Promise<void> {
    const courtId = parseString(req.params.courtId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const viewModel = await courtOpeningHoursService.getListPage(courtId);
    const listViewModel = this.withBreadcrumbs(courtId, viewModel);

    renderResponse(res, listViewModel, 'court-opening-hours');
  }

  @route('/add')
  @GET()
  public async getAdd(req: Request, res: Response): Promise<void> {
    const courtId = parseString(req.params.courtId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const viewModel = await courtOpeningHoursService.getEditPage(courtId);
    const addViewModel = this.withBreadcrumbs(courtId, viewModel, 'Edit opening hours');

    renderResponse(res, addViewModel, 'court-opening-hours-edit');
  }

  @route('/edit/:openingHoursId')
  @GET()
  public async getEdit(req: Request, res: Response): Promise<void> {
    const courtId = parseString(req.params.courtId);
    const openingHoursId = parseString(req.params.openingHoursId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    if (!this.validateUuid(openingHoursId, res, 'not-found')) {
      return;
    }

    const viewModel = await courtOpeningHoursService.getEditPage(courtId, openingHoursId);
    const editViewModel = this.withBreadcrumbs(courtId, viewModel, 'Edit opening hours');

    renderResponse(res, editViewModel, 'court-opening-hours-edit', 'not-found');
  }

  @route('/save')
  @POST()
  public async postAdd(req: Request, res: Response): Promise<void> {
    await this.save(req, res);
  }

  @route('/save/:openingHoursId')
  @POST()
  public async postEdit(req: Request, res: Response): Promise<void> {
    await this.save(req, res, parseString(req.params.openingHoursId));
  }

  @route('/delete/:openingHoursId')
  @GET()
  public async getDelete(req: Request, res: Response): Promise<void> {
    const courtId = parseString(req.params.courtId);
    const openingHoursId = parseString(req.params.openingHoursId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    if (!this.validateUuid(openingHoursId, res, 'not-found')) {
      return;
    }

    const viewModel = await courtOpeningHoursService.getDeletePage(courtId, openingHoursId);
    const deleteViewModel = this.withBreadcrumbs(courtId, viewModel, 'Delete opening hours');

    renderResponse(res, deleteViewModel, 'court-opening-hours-delete', 'not-found');
  }

  @route('/delete/success/:openingHoursId')
  @POST()
  public async postDelete(req: Request, res: Response): Promise<void> {
    const courtId = parseString(req.params.courtId);
    const openingHoursId = parseString(req.params.openingHoursId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    if (!this.validateUuid(openingHoursId, res, 'not-found')) {
      return;
    }

    const viewModel = await courtOpeningHoursService.delete(courtId, openingHoursId);
    const deleteSuccessViewModel = this.withBreadcrumbs(courtId, viewModel, 'Opening hours deleted');

    renderResponse(res, deleteSuccessViewModel, 'court-opening-hours-delete-success', 'not-found');
  }

  private async save(req: Request, res: Response, openingHoursId?: string): Promise<void> {
    const courtId = parseString(req.params.courtId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    if (openingHoursId && !this.validateUuid(openingHoursId, res, 'not-found')) {
      return;
    }

    const form = this.toForm(req.body);
    const saveResult = await courtOpeningHoursService.save(courtId, openingHoursId, form);

    if (saveResult.type === 'validation_error') {
      res.status(HttpStatusCode.BadRequest);
      res.render('court-opening-hours-edit', {
        ...saveResult.viewModel,
        breadcrumbs: this.buildOpeningHoursBreadcrumbs(courtId, saveResult.viewModel.courtName, 'Edit opening hours'),
      });
      return;
    }

    if (saveResult.type === 'status') {
      renderStatus(res, saveResult.status, openingHoursId ? 'not-found' : 'court-not-found');
      return;
    }

    res.render('court-opening-hours-save-success', {
      ...saveResult.viewModel,
      breadcrumbs: this.buildOpeningHoursBreadcrumbs(courtId, saveResult.viewModel.courtName, 'Opening hours saved'),
    });
  }

  private toForm(body: Record<string, unknown>): OpeningHoursForm {
    return {
      ...body,
      openingHourTypeId: parseOptionalString(body.openingHourTypeId),
      sameTime: parseOptionalString(body.sameTime),
      selectedDays: courtOpeningHoursService.getSelectedDays(body.selectedDays),
    } as OpeningHoursForm;
  }

  private validateUuid(value: string, res: Response, template: string): boolean {
    if (!value || !isUuid(value)) {
      res.status(HttpStatusCode.NotFound);
      res.render(template);
      return false;
    }

    return true;
  }

  private buildOpeningHoursBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(courtId, courtName, 'Court opening hours', 'court-opening-hours', currentPage);
  }

  private withBreadcrumbs<T extends { courtName: string }>(
    courtId: string,
    viewModel: T | HttpStatusCode,
    currentPage?: string
  ): T | HttpStatusCode {
    if (typeof viewModel === 'number') {
      return viewModel;
    }

    return {
      ...viewModel,
      breadcrumbs: this.buildOpeningHoursBreadcrumbs(courtId, viewModel.courtName, currentPage),
    };
  }
}
