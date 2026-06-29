import { HttpStatusCode } from 'axios';
import { Response } from 'express';

export function renderResponse(
  res: Response,
  viewModel: unknown,
  template: string,
  notFoundTemplate = 'court-not-found'
): void {
  if (typeof viewModel === 'number') {
    renderStatus(res, viewModel, notFoundTemplate);
    return;
  }

  res.render(template, viewModel as object);
}

export function renderStatus(res: Response, status: HttpStatusCode, notFoundTemplate = 'court-not-found'): void {
  if (status === HttpStatusCode.NotFound) {
    res.status(HttpStatusCode.NotFound);
    res.render(notFoundTemplate);
    return;
  }

  res.status(status);
  res.render('error');
}
