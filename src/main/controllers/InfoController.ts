import * as os from 'os';

import { InfoContributor, infoRequestHandler } from '@hmcts/info-provider';
import { GET, route } from 'awilix-express';
import { NextFunction, Request, Response } from 'express';

import { OperationsApi } from '../requests/OperationsApi';
import { dataApiUrl } from '../requests/utils/axiosConfig';

import BaseController from './BaseController';

const operationsApi = new OperationsApi();

@route('/info')
export default class InfoController extends BaseController {
  @GET()
  public async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    infoRequestHandler({
      extraBuildInfo: {
        host: os.hostname(),
        name: 'FaCT Admin Frontend',
        uptime: process.uptime(),
        dataApiUp: await operationsApi.checkHealth(),
      },
      info: {
        DataApi: new InfoContributor(dataApiUrl + '/info'),
      },
    })(req, res, next);
  }
}
