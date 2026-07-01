import { HttpStatusCode } from 'axios';
import { Response } from 'express';

export const renderCourtNotFound = (res: Response): void => {
  res.status(HttpStatusCode.NotFound);
  res.render('court-not-found');
};

export const renderError = (res: Response, status: HttpStatusCode): void => {
  res.status(status);
  res.render('error');
};
