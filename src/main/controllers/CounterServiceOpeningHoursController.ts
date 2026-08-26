import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import {
  CounterServiceOpeningHoursForm,
  CounterServiceOpeningHoursService,
} from '../services/CounterServiceOpeningHoursService';
import { parseOptionalString } from '../utils/valueParsers';

import BaseController from './BaseController';
import { buildSectionBreadcrumbs } from './helpers/breadcrumbs';

const counterServiceOpeningHoursService = new CounterServiceOpeningHoursService();

@route('/courts/:courtId/edit/counter-service-opening-hours')
export default class CounterServiceOpeningHoursController extends BaseController {
  @GET()
  public async getList(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    const viewModel = await counterServiceOpeningHoursService.getListPage(courtId);

    this.renderResponse(
      res,
      this.withBreadcrumbs(courtId, viewModel),
      'counter-service-opening-hours',
      'court-not-found'
    );
  }

  @route('/add')
  @GET()
  public async getAdd(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    const viewModel = await counterServiceOpeningHoursService.getEditPage(courtId);

    this.renderResponse(
      res,
      this.withBreadcrumbs(courtId, viewModel, 'Edit opening hours'),
      'counter-service-opening-hours-edit',
      'court-not-found'
    );
  }

  @route('/edit/:counterServiceId')
  @GET()
  public async getEdit(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    const counterServiceId = this.getUuidRouteParam(req, 'counterServiceId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    if (!counterServiceId) {
      this.renderNotFound(res);
      return;
    }

    const viewModel = await counterServiceOpeningHoursService.getEditPage(courtId, counterServiceId);

    this.renderResponse(
      res,
      this.withBreadcrumbs(courtId, viewModel, 'Edit opening hours'),
      'counter-service-opening-hours-edit',
      'not-found'
    );
  }

  @route('/save')
  @POST()
  public async postAdd(req: Request, res: Response): Promise<void> {
    await this.save(req, res);
  }

  @route('/save/:counterServiceId')
  @POST()
  public async postEdit(req: Request, res: Response): Promise<void> {
    await this.save(req, res, true);
  }

  @route('/delete/:counterServiceId')
  @GET()
  public async getDelete(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    const counterServiceId = this.getUuidRouteParam(req, 'counterServiceId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    if (!counterServiceId) {
      this.renderNotFound(res);
      return;
    }

    const viewModel = await counterServiceOpeningHoursService.getDeletePage(courtId, counterServiceId);
    const deleteViewModel =
      typeof viewModel === 'number'
        ? viewModel
        : {
            ...viewModel,
            cancelHref: `/courts/${courtId}/edit/counter-service-opening-hours`,
          };

    this.renderResponse(
      res,
      this.withBreadcrumbs(courtId, deleteViewModel, 'Delete opening hours'),
      'counter-service-opening-hours-delete',
      'not-found'
    );
  }

  @route('/delete/success/:counterServiceId')
  @POST()
  public async postDelete(req: Request, res: Response): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    const counterServiceId = this.getUuidRouteParam(req, 'counterServiceId');

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    if (!counterServiceId) {
      this.renderNotFound(res);
      return;
    }

    const viewModel = await counterServiceOpeningHoursService.delete(courtId, counterServiceId);

    this.renderResponse(
      res,
      this.withBreadcrumbs(courtId, viewModel, 'Opening hours deleted'),
      'counter-service-opening-hours-delete-success',
      'not-found'
    );
  }

  private async save(req: Request, res: Response, isEdit = false): Promise<void> {
    const courtId = this.getUuidRouteParam(req, 'courtId');
    const counterServiceId = isEdit ? this.getUuidRouteParam(req, 'counterServiceId') : undefined;

    if (!courtId) {
      this.renderCourtNotFound(res);
      return;
    }

    if (isEdit && !counterServiceId) {
      this.renderNotFound(res);
      return;
    }

    const form = this.toForm(req.body);
    const saveResult = await counterServiceOpeningHoursService.save(courtId, counterServiceId, form);

    if (saveResult.type === 'validation_error') {
      return res.status(HttpStatusCode.BadRequest).render('counter-service-opening-hours-edit', {
        ...saveResult.viewModel,
        breadcrumbs: this.buildCounterServiceBreadcrumbs(courtId, saveResult.viewModel.courtName, 'Edit opening hours'),
      });
    }

    if (saveResult.type === 'status') {
      this.renderStatus(res, saveResult.status, counterServiceId ? 'not-found' : 'court-not-found');
      return;
    }

    res.render('counter-service-opening-hours-save-success', {
      ...saveResult.viewModel,
      breadcrumbs: this.buildCounterServiceBreadcrumbs(
        courtId,
        saveResult.viewModel.courtName,
        'Counter service opening hours saved'
      ),
    });
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

  private buildCounterServiceBreadcrumbs(courtId: string, courtName: string, currentPage?: string) {
    return buildSectionBreadcrumbs(
      courtId,
      courtName,
      'Counter service opening hours',
      'counter-service-opening-hours',
      currentPage
    );
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
      breadcrumbs: this.buildCounterServiceBreadcrumbs(courtId, viewModel.courtName, currentPage),
    };
  }
}
