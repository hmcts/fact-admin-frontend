import * as os from 'os';

import { InfoContributor, infoRequestHandler } from '@hmcts/info-provider';
import { GET, route } from 'awilix-express';
import { NextFunction, Request, Response } from 'express';

import { OperationsApi } from '../requests/OperationsApi';
import { dataApiUrl } from '../requests/utils/axiosConfig';

import BaseController from './BaseController';

@route('/info')
export default class InfoController extends BaseController {
  constructor(private readonly operationsApi = new OperationsApi()) {
    super();
  }

  @GET()
  public async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    infoRequestHandler({
      extraBuildInfo: {
        host: os.hostname(),
        name: 'FaCT Admin Frontend',
        uptime: process.uptime(),
        dataApiUp: await this.operationsApi.checkHealth(),
      },
      info: {
        DataApi: new InfoContributor(dataApiUrl + '/info'),
      },
    })(req, res, next);
  }
}
