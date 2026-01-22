import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

@route('/')
export default class HomeController {
  @GET()
  public get(req: Request, res: Response): void {
    res.render('home');
  }
}
