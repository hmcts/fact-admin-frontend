import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { CounterServiceOpeningHoursService } from '../services/CounterServiceOpeningHoursService';
import { isUuid } from '../utils/valueParsers';

const counterServiceOpeningHoursService = new CounterServiceOpeningHoursService();
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
      pageTitle: `Counter Service Opening Hours - ${model.name}`,
    });
  }
}
