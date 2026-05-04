import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

import { HomePageService } from '../services/HomePageService';

const homePageService = new HomePageService();

@route('/')
export default class HomeController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const filters = homePageService.getFilters(req.query as Record<string, unknown>);
    const viewModel = await homePageService.getHomePageViewModel(filters);
    res.render('home', viewModel);
  }
}
