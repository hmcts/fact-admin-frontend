import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

import { DownloadCsvService } from '../services/DownloadCsvService';

import BaseController from './BaseController';

@route('/download')
export default class DownloadController extends BaseController {
  constructor(private readonly downloadCsvService = new DownloadCsvService()) {
    super();
  }

  @GET()
  public async get(_req: Request, res: Response): Promise<void> {
    const csvResponse = await this.downloadCsvService.getDownloadCsv();

    if (typeof csvResponse === 'number') {
      this.renderError(res, csvResponse);
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${csvResponse.filename}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csvResponse.csv);
  }
}
