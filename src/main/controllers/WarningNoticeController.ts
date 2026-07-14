import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

@route('/courts/:courtId/edit/warning-notice')
export default class WarningNoticeController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    return res.render('court-warning-notice-edit.njk', {
      courtId: req.params.courtId,
      courtName: 'Test Court',
      form: {
        warningNotice: '',
        warningNoticeCy: '',
      },
      error: {},
      errorSummary: [],
    });
  }
}
