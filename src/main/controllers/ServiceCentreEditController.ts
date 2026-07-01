import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

@route('/service-centres/:serviceCentreId/edit')
export default class ServiceCentreEditController {
  @GET()
  public get(_req: Request, res: Response): void {
    res.status(HttpStatusCode.NotFound);
    res.render('not-found');
  }
}
