import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CourtOpeningHoursService, OpeningHoursForm } from '../services/CourtOpeningHoursService';
import { isUuid } from '../utils/valueParsers';

const courtOpeningHoursService = new CourtOpeningHoursService();

@route('/courts/:courtId/edit/court-opening-hours')
export default class CourtOpeningHoursController {
  @GET()
  public async getList(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveParam(req.params.courtId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const viewModel = await courtOpeningHoursService.getListPage(courtId);

    this.renderResponse(res, viewModel, 'court-opening-hours');
  }

  @route('/add')
  @GET()
  public async getAdd(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveParam(req.params.courtId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const viewModel = await courtOpeningHoursService.getEditPage(courtId);

    this.renderResponse(res, viewModel, 'court-opening-hours-edit');
  }

  @route('/edit/:openingHoursId')
  @GET()
  public async getEdit(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveParam(req.params.courtId);
    const openingHoursId = this.resolveParam(req.params.openingHoursId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    if (!this.validateUuid(openingHoursId, res, 'not-found')) {
      return;
    }

    const viewModel = await courtOpeningHoursService.getEditPage(courtId, openingHoursId);

    this.renderResponse(res, viewModel, 'court-opening-hours-edit', 'not-found');
  }

  @route('/save')
  @POST()
  public async postAdd(req: Request, res: Response): Promise<void> {
    await this.save(req, res);
  }

  @route('/save/:openingHoursId')
  @POST()
  public async postEdit(req: Request, res: Response): Promise<void> {
    await this.save(req, res, this.resolveParam(req.params.openingHoursId));
  }

  @route('/delete/:openingHoursId')
  @GET()
  public async getDelete(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveParam(req.params.courtId);
    const openingHoursId = this.resolveParam(req.params.openingHoursId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    if (!this.validateUuid(openingHoursId, res, 'not-found')) {
      return;
    }

    const viewModel = await courtOpeningHoursService.getDeletePage(courtId, openingHoursId);

    this.renderResponse(res, viewModel, 'court-opening-hours-delete', 'not-found');
  }

  @route('/delete/success/:openingHoursId')
  @POST()
  public async postDelete(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveParam(req.params.courtId);
    const openingHoursId = this.resolveParam(req.params.openingHoursId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    if (!this.validateUuid(openingHoursId, res, 'not-found')) {
      return;
    }

    const viewModel = await courtOpeningHoursService.delete(courtId, openingHoursId);

    this.renderResponse(res, viewModel, 'court-opening-hours-delete-success', 'not-found');
  }

  private async save(req: Request, res: Response, openingHoursId?: string): Promise<void> {
    const courtId = this.resolveParam(req.params.courtId);

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
      res.render('court-opening-hours-edit', saveResult.viewModel);
      return;
    }

    if (saveResult.type === 'status') {
      this.renderStatus(res, saveResult.status, openingHoursId ? 'not-found' : 'court-not-found');
      return;
    }

    res.render('court-opening-hours-save-success', saveResult.viewModel);
  }

  private toForm(body: Record<string, unknown>): OpeningHoursForm {
    return {
      ...body,
      openingHourTypeId: this.resolveBodyString(body.openingHourTypeId),
      sameTime: this.resolveBodyString(body.sameTime),
      selectedDays: courtOpeningHoursService.getSelectedDays(body.selectedDays),
    } as OpeningHoursForm;
  }

  private renderResponse(
    res: Response,
    viewModel: unknown,
    template: string,
    notFoundTemplate = 'court-not-found'
  ): void {
    if (typeof viewModel === 'number') {
      this.renderStatus(res, viewModel, notFoundTemplate);
      return;
    }

    res.render(template, viewModel as object);
  }

  private renderStatus(res: Response, status: HttpStatusCode, notFoundTemplate = 'court-not-found'): void {
    if (status === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      res.render(notFoundTemplate);
      return;
    }

    res.status(status);
    res.render('error');
  }

  private validateUuid(value: string, res: Response, template: string): boolean {
    if (!value || !isUuid(value)) {
      res.status(HttpStatusCode.NotFound);
      res.render(template);
      return false;
    }

    return true;
  }

  private resolveParam(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] : (value ?? '');
  }

  private resolveBodyString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }
}
