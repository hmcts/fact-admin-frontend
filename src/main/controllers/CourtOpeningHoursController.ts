import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CourtOpeningHoursService, OpeningHoursForm } from '../services/CourtOpeningHoursService';
import { parseOptionalString } from '../utils/valueParsers';

import BaseController from './BaseController';
import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

@route('/courts/:courtId/edit/court-opening-hours')
export default class CourtOpeningHoursController extends BaseController {
  constructor(private readonly courtOpeningHoursService = new CourtOpeningHoursService()) {
    super();
  }

  @GET()
  public async getList(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    const viewModel = await this.courtOpeningHoursService.getListPage(courtId);

    this.renderResponse(res, this.withBreadcrumbs(courtId, viewModel), 'court-opening-hours', 'court-not-found');
  }

  @route('/add')
  @GET()
  public async getAdd(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    const viewModel = await this.courtOpeningHoursService.getEditPage(courtId);

    this.renderResponse(
      res,
      this.withBreadcrumbs(courtId, viewModel, 'Edit opening hours'),
      'court-opening-hours-edit',
      'court-not-found'
    );
  }

  @route('/edit/:openingHoursId')
  @GET()
  public async getEdit(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    const openingHoursId = this.getUuidRouteParam(req, 'openingHoursId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    if (!openingHoursId) {
      this.renderNotFound(res);
      return;
    }

    const viewModel = await this.courtOpeningHoursService.getEditPage(courtId, openingHoursId);

    this.renderResponse(
      res,
      this.withBreadcrumbs(courtId, viewModel, 'Edit opening hours'),
      'court-opening-hours-edit',
      'not-found'
    );
  }

  @route('/save')
  @POST()
  public async postAdd(req: Request, res: Response): Promise<void> {
    await this.save(req, res);
  }

  @route('/save/:openingHoursId')
  @POST()
  public async postEdit(req: Request, res: Response): Promise<void> {
    await this.save(req, res, true);
  }

  @route('/delete/:openingHoursId')
  @GET()
  public async getDelete(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    const openingHoursId = this.getUuidRouteParam(req, 'openingHoursId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    if (!openingHoursId) {
      this.renderNotFound(res);
      return;
    }

    const viewModel = await this.courtOpeningHoursService.getDeletePage(courtId, openingHoursId);
    const deleteViewModel =
      typeof viewModel === 'number'
        ? viewModel
        : {
            ...viewModel,
            cancelHref: `/courts/${courtId}/edit/court-opening-hours`,
          };

    this.renderResponse(
      res,
      this.withBreadcrumbs(courtId, deleteViewModel, 'Delete opening hours'),
      'court-opening-hours-delete',
      'not-found'
    );
  }

  @route('/delete/success/:openingHoursId')
  @POST()
  public async postDelete(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    const openingHoursId = this.getUuidRouteParam(req, 'openingHoursId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    if (!openingHoursId) {
      this.renderNotFound(res);
      return;
    }

    const viewModel = await this.courtOpeningHoursService.delete(courtId, openingHoursId);

    this.renderResponse(
      res,
      this.withBreadcrumbs(courtId, viewModel, 'Opening hours deleted'),
      'court-opening-hours-delete-success',
      'not-found'
    );
  }

  private async save(req: Request, res: Response, isEdit = false): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    const openingHoursId = isEdit ? this.getUuidRouteParam(req, 'openingHoursId') : undefined;

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    if (isEdit && !openingHoursId) {
      this.renderNotFound(res);
      return;
    }

    const form = this.toForm(req.body);
    const saveResult = await this.courtOpeningHoursService.save(courtId, openingHoursId, form);

    if (saveResult.type === 'validation_error') {
      return res.status(HttpStatusCode.BadRequest).render('court-opening-hours-edit', {
        ...saveResult.viewModel,
        breadcrumbs: this.buildOpeningHoursBreadcrumbs(courtId, saveResult.viewModel.courtName, 'Edit opening hours'),
      });
    }

    if (saveResult.type === 'status') {
      return this.renderStatus(res, saveResult.status, openingHoursId ? 'not-found' : 'court-not-found');
    }

    return res.render('court-opening-hours-save-success', {
      ...saveResult.viewModel,
      breadcrumbs: this.buildOpeningHoursBreadcrumbs(courtId, saveResult.viewModel.courtName, 'Opening hours saved'),
    });
  }

  private toForm(body: Record<string, unknown>): OpeningHoursForm {
    return {
      ...body,
      openingHourTypeId: parseOptionalString(body.openingHourTypeId),
      sameTime: parseOptionalString(body.sameTime),
      selectedDays: this.courtOpeningHoursService.getSelectedDays(body.selectedDays),
    } as OpeningHoursForm;
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
