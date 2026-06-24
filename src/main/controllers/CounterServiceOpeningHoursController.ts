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

  // export default class CounterServiceOpeningHoursController {
  //   @GET()
  //   public async renderEditView(req: Request, res: Response): Promise<void> {
  //     const { courtId } = req.params;
  //     const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;
  //     if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
  //       res.status(HttpStatusCode.NotFound);
  //       return res.render('court-not-found');
  //     }
  //
  //     const model = await counterServiceOpeningHoursService.retrieve(resolvedCourtId);
  //
  //     const courtTypes = await typesService.listCourtTypes();
  //     if (!this.validateServiceResponse(courtTypes, res, 'not-found')) {
  //       return;
  //     }
  //
  //     if (model === HttpStatusCode.NotFound) {
  //       res.status(HttpStatusCode.NotFound);
  //       return res.render('court-not-found');
  //     }
  //     if (typeof model === 'number') {
  //       res.status(model);
  //       return res.render('error');
  //     }
  //     res.render('counter-service-opening-hours-edit', {
  //       courtId: resolvedCourtId,
  //       model,
  //       courtTypes,
  //       pageTitle: `Counter Service Opening Hours - ${model.name}`,
  //     });
  //   }

  // private validateServiceResponse(response: unknown, res: Response, notFoundView?: string): boolean {
  //   if (this.isHttpStatus(response)) {
  //     this.renderServiceError(res, response, notFoundView);
  //     return false;
  //   }
  //   return true;
  // }

  // private isHttpStatus(result: unknown): result is number {
  //   return typeof result === 'number';
  // }
  //
  // private renderServiceError(res: Response, status: number, notFoundView?: string): void {
  //   if (status === HttpStatusCode.NotFound && notFoundView) {
  //     res.status(HttpStatusCode.NotFound);
  //     res.render(notFoundView);
  //     return;
  //   }
  //
  //   res.status(status);
  //   res.render('error');
  // }

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
