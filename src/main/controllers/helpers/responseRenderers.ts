import { HttpStatusCode } from 'axios';
import { Response } from 'express';

export const renderNotFound = (
  res: Response,
  template: 'court-not-found' | 'service-centre-not-found' | 'not-found' = 'not-found'
): void => {
  res.status(HttpStatusCode.NotFound);
  res.render(template);
};

export const renderCourtNotFound = (res: Response): void => {
  renderNotFound(res, 'court-not-found');
};

export const renderServiceCentreNotFound = (res: Response): void => {
  renderNotFound(res, 'service-centre-not-found');
};

export const renderError = (res: Response, status: HttpStatusCode): void => {
  res.status(status);
  res.render('error');
};
