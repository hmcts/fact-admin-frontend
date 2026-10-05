import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';

import { AddCourtService } from '../../services/courts/AddCourtService';
import BaseController from '../BaseController';

@route('/add-court')
export default class AddCourtController extends BaseController {
  constructor(private readonly addCourtService = new AddCourtService()) {
    super();
  }

  @GET()
  public async get(_req: Request, res: Response): Promise<void> {
    const viewModel = await this.addCourtService.getViewModel();

    if (typeof viewModel === 'number') {
      return this.renderError(res, viewModel);
    }

    return res.render('add-court', {
      ...viewModel,
    });
  }

  @POST()
  public async createCourt(req: Request, res: Response): Promise<void> {
    const createResult = await this.addCourtService.create({
      name: req.body?.name ?? undefined,
      regionId: req.body?.regionId ?? undefined,
    });

    if (typeof createResult === 'number') {
      return this.renderError(res, createResult);
    }

    if ('errors' in createResult) {
      return res.render('add-court', {
        ...createResult,
      });
    }

    if (!('courtId' in createResult)) {
      return this.renderError(res, 500);
    }

    return res.render('add-court-success', {
      ...createResult,
    });
  }
}
