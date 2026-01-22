import * as os from 'os';

import { infoRequestHandler } from '@hmcts/info-provider';
import { GET, route } from 'awilix-express';
import { NextFunction, Request, Response } from 'express';

@route('/info')
export default class InfoController {
  @GET()
  public get(req: Request, res: Response, next: NextFunction): void {
    infoRequestHandler({
      extraBuildInfo: {
        host: os.hostname(),
        name: 'FaCT Admin Frontend',
        uptime: process.uptime(),
      },
      info: {
        // TODO: add downstream info endpoints if your app has any
      },
    })(req, res, next);
  }
}
