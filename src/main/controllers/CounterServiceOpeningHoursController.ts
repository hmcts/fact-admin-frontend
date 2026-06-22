import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CounterServiceOpeningHoursService } from '../services/CounterServiceOpeningHoursService';
import { TypesService } from '../services/TypesService';
import { isUuid } from '../utils/valueParsers';

const counterServiceOpeningHoursService = new CounterServiceOpeningHoursService();
const typesService = new TypesService();

@route('/courts/:courtId/edit/counter-service-opening-hours')
export default class CounterServiceOpeningHoursController {
  @GET()
  public async renderEditView(req: Request, res: Response): Promise<void> {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;
    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const model = await counterServiceOpeningHoursService.retrieve(resolvedCourtId);

    const courtTypes = await typesService.listCourtTypes();
    if (!this.validateServiceResponse(courtTypes, res, 'not-found')) {
      return;
    }

    if (model === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }
    if (typeof model === 'number') {
      res.status(model);
      return res.render('error');
    }
    res.render('counter-service-opening-hours-edit', {
      courtId: resolvedCourtId,
      model,
      courtTypes,
      pageTitle: `Counter Service Opening Hours - ${model.name}`,
    });
  }

  private validateServiceResponse(response: unknown, res: Response, notFoundView?: string): boolean {
    if (this.isHttpStatus(response)) {
      this.renderServiceError(res, response, notFoundView);
      return false;
    }
    return true;
  }

  private isHttpStatus(result: unknown): result is number {
    return typeof result === 'number';
  }

  private renderServiceError(res: Response, status: number, notFoundView?: string): void {
    if (status === HttpStatusCode.NotFound && notFoundView) {
      res.status(HttpStatusCode.NotFound);
      res.render(notFoundView);
      return;
    }

    res.status(status);
    res.render('error');
  }
}
