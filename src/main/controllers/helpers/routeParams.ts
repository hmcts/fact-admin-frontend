import { Request, Response } from 'express';

import { isUuid } from '../../utils/valueParsers';

import { renderCourtNotFound } from './responseRenderers';

export type RouteParamName = 'courtId' | 'contactDetailId' | 'serviceCentreId' | 'addressId';

export const getRouteParam = (req: Request, paramName: RouteParamName): string | undefined => {
  const paramValue = req.params[paramName];
  return Array.isArray(paramValue) ? paramValue[0] : paramValue;
};

export const getUuidRouteParam = (req: Request, paramName: RouteParamName): string | undefined => {
  const value = getRouteParam(req, paramName);
  return value && isUuid(value) ? value : undefined;
};

export const ensureValidCourtId = (courtId: string, res: Response): boolean => {
  const isValidCourtId = isUuid(courtId);
  if (!isValidCourtId) {
    renderCourtNotFound(res);
    return false;
  }

  return true;
};
