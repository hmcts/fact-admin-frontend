import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

import { isViewer } from '../modules/authentication/authenticationHelper';
import { HomePageService } from '../services/HomePageService';

const homePageService = new HomePageService();

@route('/')
export default class HomeController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const filters = homePageService.getFilters(req.query as Record<string, unknown>);
    const viewModel = await homePageService.getHomePageViewModel(filters, isViewer(req));
    res.render('home', viewModel);
  }
}
