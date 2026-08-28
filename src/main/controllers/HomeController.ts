import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

import { isViewer } from '../modules/authentication/authenticationHelper';
import { HomePageService } from '../services/HomePageService';

import BaseController from './BaseController';

@route('/')
export default class HomeController extends BaseController {
  constructor(private readonly homePageService = new HomePageService()) {
    super();
  }

  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const filters = this.homePageService.getFilters(req.query as Record<string, unknown>);
    const viewModel = await this.homePageService.getHomePageViewModel(filters, isViewer(req));
    res.render('home', viewModel);
  }
}
