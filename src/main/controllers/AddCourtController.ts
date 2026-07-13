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
      return res.status(viewModel).render('error');
    }

    return res.render('add-court', {
      ...viewModel,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: '#', text: 'Add new court' },
      ],
    });
  }

  @POST()
  public async createCourt(req: Request, res: Response): Promise<void> {
    const createResult = await addCourtService.create({
      name: req.body?.name ?? undefined,
      regionId: req.body?.regionId ?? undefined,
    });

    if (typeof createResult === 'number') {
      return res.status(createResult).render('error');
    }

    if ('errors' in createResult) {
      return res.render('add-court', {
        ...createResult,
        breadcrumbs: [
          { href: '/', text: 'Home' },
          { href: '#', text: 'Add new court' },
        ],
      });
    }

    if (!('courtId' in createResult)) {
      return res.status(500).render('error');
    }

    return res.render('add-court-success', {
      ...createResult,
      breadcrumbs: [
        { href: '/', text: 'Home' },
        { href: `/courts/${createResult.courtId}/edit`, text: createResult.courtName },
        { href: '#', text: 'Addresses' },
      ],
    });
  }
}
