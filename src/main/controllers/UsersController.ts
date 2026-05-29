import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

@route('/users')
export default class UsersController {
  @GET()
  public async get(_req: Request, res: Response): Promise<void> {
    res.render('users', {
      pageTitle: 'Users',
    });
  }
}
