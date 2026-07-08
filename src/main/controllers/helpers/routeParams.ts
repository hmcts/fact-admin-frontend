import { Request } from 'express';

import { isUuid } from '../../utils/valueParsers';

export type RouteParamName = 'courtId' | 'contactDetailId';

export const getRouteParam = (req: Request, paramName: RouteParamName): string | undefined => {
  const paramValue = req.params[paramName];
  return Array.isArray(paramValue) ? paramValue[0] : paramValue;
};

export const getUuidRouteParam = (req: Request, paramName: RouteParamName): string | undefined => {
  const value = getRouteParam(req, paramName);
  return value && isUuid(value) ? value : undefined;
};
