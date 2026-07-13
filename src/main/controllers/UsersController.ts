import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

import { UsersPageService } from '../services/UsersPageService';

@route('/users')
export default class UsersController {
  public constructor(private readonly usersPageService = new UsersPageService()) {}

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const filters = this.usersPageService.getFilters(req.query as Record<string, unknown>);
    const viewModel = await this.usersPageService.getUsersPageViewModel(filters);

    res.render('users', viewModel);
  }
}
