import { GET, POST, route } from 'awilix-express';
import { Request, Response } from 'express';

import { AddCourtService } from '../services/AddCourtService';

const addCourtService = new AddCourtService();

@route('/add-court')
export default class AddCourtController {
  @GET()
  public async get(_req: Request, res: Response): Promise<void> {
    const viewModel = await addCourtService.getViewModel();

    if (typeof viewModel === 'number') {
      res.status(viewModel);
      res.render('error');
      return;
    }

    res.render('add-court', viewModel);
  }

  @POST()
  public async createCourt(req: Request, res: Response): Promise<void> {
    const createResult = await addCourtService.create({
      name: req.body?.name ?? undefined,
      regionId: req.body?.regionId ?? undefined,
    });

    if (typeof createResult === 'number') {
      res.status(createResult);
      res.render('error');
      return;
    }

    if ('errors' in createResult) {
      res.render('add-court', createResult);
      return;
    }

    res.render('add-court-success', createResult);
  }
}
