import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { isUuid } from '../utils/valueParsers';

export type NotFoundTemplate = 'court-not-found' | 'service-centre-not-found' | 'not-found';

export default abstract class BaseController {
  protected getRouteParam(req: Request, paramName: string): string | undefined {
    const value = req.params?.[paramName];
    return Array.isArray(value) ? value[0] : value;
  }

  protected getUuidRouteParam(req: Request, paramName: string): string | undefined {
    const value = this.getRouteParam(req, paramName);
    return value && isUuid(value) ? value : undefined;
  }

  protected renderNotFound(res: Response, template: NotFoundTemplate = 'not-found'): void {
    res.status(HttpStatusCode.NotFound);
    res.render(template);
  }

  protected renderCourtNotFound(res: Response): void {
    this.renderNotFound(res, 'court-not-found');
  }

  protected renderServiceCentreNotFound(res: Response): void {
    this.renderNotFound(res, 'service-centre-not-found');
  }

  protected renderError(res: Response, status: HttpStatusCode): void {
    res.status(status);
    res.render('error');
  }

  protected renderStatus(res: Response, status: HttpStatusCode, notFoundTemplate?: NotFoundTemplate): void {
    if (status === HttpStatusCode.NotFound && notFoundTemplate) {
      this.renderNotFound(res, notFoundTemplate);
      return;
    }

    this.renderError(res, status);
  }

  protected renderStatusResponse<T>(
    res: Response,
    result: T | HttpStatusCode,
    notFoundTemplate?: NotFoundTemplate
  ): result is HttpStatusCode {
    if (typeof result !== 'number') {
      return false;
    }

    this.renderStatus(res, result, notFoundTemplate);
    return true;
  }

  protected renderResponse<T>(
    res: Response,
    result: T | HttpStatusCode,
    template: string,
    notFoundTemplate?: NotFoundTemplate
  ): void {
    if (this.renderStatusResponse(res, result, notFoundTemplate)) {
      return;
    }

    res.render(template, result as object);
  }
}
