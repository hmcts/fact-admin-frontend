import { GET, POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CounterServiceOpeningHoursService } from '../services/CounterServiceOpeningHoursService';
import { renderResponse } from '../utils/responseRendering';
import { isUuid } from '../utils/valueParsers';

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
