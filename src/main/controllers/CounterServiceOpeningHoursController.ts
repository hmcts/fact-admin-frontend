import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import {
  CounterServiceOpeningHoursForm,
  CounterServiceOpeningHoursService,
} from '../services/CounterServiceOpeningHoursService';
import { renderResponse, renderStatus } from '../utils/responseRendering';
import { isUuid, parseOptionalString, parseString } from '../utils/valueParsers';

const counterServiceOpeningHoursService = new CounterServiceOpeningHoursService();

@route('/courts/:courtId/edit/counter-service-opening-hours')
export default class CounterServiceOpeningHoursController {
  @GET()
  public async getList(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveParam(req.params.courtId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const viewModel = await counterServiceOpeningHoursService.getListPage(courtId);

    renderResponse(res, viewModel, 'counter-service-opening-hours');
  }

  @route('/add')
  @GET()
  public async getAdd(req: Request, res: Response): Promise<void> {
    const courtId = parseString(req.params.courtId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    const viewModel = await counterServiceOpeningHoursService.getEditPage(courtId);

    renderResponse(res, viewModel, 'counter-service-opening-hours-edit');
  }

  @route('/edit/:counterServiceId')
  @GET()
  public async getEdit(req: Request, res: Response): Promise<void> {
    const courtId = parseString(req.params.courtId);
    const counterServiceId = parseString(req.params.counterServiceId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    if (!this.validateUuid(counterServiceId, res, 'not-found')) {
      return;
    }

    const viewModel = await counterServiceOpeningHoursService.getEditPage(courtId, counterServiceId);

    renderResponse(res, viewModel, 'counter-service-opening-hours-edit', 'not-found');
  }

  @route('/save')
  @POST()
  public async postAdd(req: Request, res: Response): Promise<void> {
    await this.save(req, res);
  }

  @route('/save/:counterServiceId')
  @POST()
  public async postEdit(req: Request, res: Response): Promise<void> {
    await this.save(req, res, parseString(req.params.counterServiceId));
  }

  @route('/delete/:counterServiceId')
  @GET()
  public async getDelete(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveParam(req.params.courtId);
    const counterServiceId = this.resolveParam(req.params.counterServiceId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    if (!this.validateUuid(counterServiceId, res, 'not-found')) {
      return;
    }

    const viewModel = await counterServiceOpeningHoursService.getDeletePage(courtId, counterServiceId);

    renderResponse(res, viewModel, 'counter-service-opening-hours-delete', 'not-found');
  }

  @route('/delete/success/:counterServiceId')
  @POST()
  public async postDelete(req: Request, res: Response): Promise<void> {
    const courtId = this.resolveParam(req.params.courtId);
    const counterServiceId = this.resolveParam(req.params.counterServiceId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    if (!this.validateUuid(counterServiceId, res, 'not-found')) {
      return;
    }

    const viewModel = await counterServiceOpeningHoursService.delete(courtId, counterServiceId);

    renderResponse(res, viewModel, 'counter-service-opening-hours-delete-success', 'not-found');
  }

  private async save(req: Request, res: Response, counterServiceId?: string): Promise<void> {
    const courtId = parseString(req.params.courtId);

    if (!this.validateUuid(courtId, res, 'court-not-found')) {
      return;
    }

    if (counterServiceId && !this.validateUuid(counterServiceId, res, 'not-found')) {
      return;
    }

    const form = this.toForm(req.body);
    const saveResult = await counterServiceOpeningHoursService.save(courtId, counterServiceId, form);

    if (saveResult.type === 'validation_error') {
      res.status(HttpStatusCode.BadRequest);
      res.render('counter-service-opening-hours-edit', saveResult.viewModel);
      return;
    }

    if (saveResult.type === 'status') {
      renderStatus(res, saveResult.status, counterServiceId ? 'not-found' : 'court-not-found');
      return;
    }

    res.render('counter-service-opening-hours-save-success', saveResult.viewModel);
  }

  private toForm(body: Record<string, unknown>): CounterServiceOpeningHoursForm {
    return {
      ...body,
      assistWith: counterServiceOpeningHoursService.getSelectedDays(body.assistWith),
      appointmentNeeded: parseOptionalString(body.appointmentNeeded),
      appointmentContact: parseOptionalString(body.appointmentContact),
      sameTime: parseOptionalString(body.sameTime),
      selectedDays: counterServiceOpeningHoursService.getSelectedDays(body.selectedDays),
    } as CounterServiceOpeningHoursForm;
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
}
