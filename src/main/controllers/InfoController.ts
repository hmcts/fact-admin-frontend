import * as os from 'os';

import { InfoContributor, infoRequestHandler } from '@hmcts/info-provider';
import { GET, route } from 'awilix-express';
import { NextFunction, Request, Response } from 'express';

import { DataApiRequests } from '../requests/DataApiRequests';
import { dataApiUrl } from '../requests/utils/axiosConfig';

const dataApiRequests = new DataApiRequests();

@route('/info')
export default class InfoController {
  @GET()
  public async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    infoRequestHandler({
      extraBuildInfo: {
        host: os.hostname(),
        name: 'FaCT Admin Frontend',
        uptime: process.uptime(),
        dataApiUp: await dataApiRequests.checkHealth(),
      },
      info: {
        DataApi: new InfoContributor(dataApiUrl + '/info'),
      },
    })(req, res, next);
  }
}
