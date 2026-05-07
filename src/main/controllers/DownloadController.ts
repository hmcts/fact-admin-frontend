import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

import { DownloadCsvService } from '../services/DownloadCsvService';

const downloadCsvService = new DownloadCsvService();

@route('/download')
export default class DownloadController {
  @GET()
  public async get(_req: Request, res: Response): Promise<void> {
    const csvResponse = await downloadCsvService.getDownloadCsv();

    if (typeof csvResponse === 'number') {
      res.status(csvResponse);
      res.render('error');
      return;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${csvResponse.filename}"`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.send(csvResponse.csv);
  }
}
