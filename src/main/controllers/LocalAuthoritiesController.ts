import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { LocalAuthoritiesService } from '../services/LocalAuthoritiesService';
import { isUuid } from '../utils/valueParsers';

const localAuthoritiesService = new LocalAuthoritiesService();

@route('/courts/:courtId/edit/local-authorities')
export default class LocalAuthoritiesController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    const viewModel = await localAuthoritiesService.retrieve(resolvedCourtId);

    if (viewModel === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      return res.render('court-not-found');
    }

    if (typeof viewModel === 'number') {
      res.status(viewModel);
      return res.render('error');
    }

    res.render('local-authorities', viewModel);
  }
}
