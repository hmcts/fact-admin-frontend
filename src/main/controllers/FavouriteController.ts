import { POST, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { DataApiRequests } from '../requests/DataApiRequests';
import { subjectTypeSchema } from '../schemas/subjectTypeSchema';
import { isUuid } from '../utils/valueParsers';

const SAFE_ORIGIN = 'https://fact-admin.local';
const SAFE_RETURN_KEYS = new Set([
  'favouritesPageNumber',
  'includeClosed',
  'onlyServiceCentres',
  'pageNumber',
  'pageSize',
  'partialCourtName',
  'regionId',
  'sortBy',
  'sortOrder',
  'tab',
]);
const SAFE_RETURN_HASHES = new Set(['', '#courts', '#favourites']);
const COURT_NAME_PATTERN = /^[A-Za-z&'()\- ]*$/;

@route('/favourites/:subjectType/:subjectId')
export default class FavouriteController {
  public constructor(private readonly dataApiRequests = new DataApiRequests()) {}

  @POST()
  public async add(req: Request, res: Response): Promise<void> {
    await this.mutate(req, res, false);
  }

  @route('/remove')
  @POST()
  public async remove(req: Request, res: Response): Promise<void> {
    await this.mutate(req, res, true);
  }

  private async mutate(req: Request, res: Response, remove: boolean): Promise<void> {
    const subjectType = subjectTypeSchema.safeParse(req.params.subjectType);
    const subjectId = req.params.subjectId;

    if (!subjectType.success || typeof subjectId !== 'string' || !isUuid(subjectId)) {
      res.status(HttpStatusCode.BadRequest).render('error');
      return;
    }

    const status = remove
      ? await this.dataApiRequests.removeFavourite({ subjectId, subjectType: subjectType.data })
      : await this.dataApiRequests.addFavourite({ subjectId, subjectType: subjectType.data });
    const expectedStatus = remove ? HttpStatusCode.NoContent : HttpStatusCode.Created;

    if (status !== expectedStatus) {
      res.status(status).render('error');
      return;
    }

    res.redirect(HttpStatusCode.SeeOther, getSafeReturnPath(req.body?.returnPath));
  }
}

export function getSafeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }

  let returnUrl: URL;
  try {
    returnUrl = new URL(value, SAFE_ORIGIN);
  } catch {
    return '/';
  }

  if (returnUrl.origin !== SAFE_ORIGIN || returnUrl.pathname !== '/' || !SAFE_RETURN_HASHES.has(returnUrl.hash)) {
    return '/';
  }

  for (const key of returnUrl.searchParams.keys()) {
    if (!SAFE_RETURN_KEYS.has(key) || returnUrl.searchParams.getAll(key).length !== 1) {
      return '/';
    }
  }

  if (!hasValidReturnParameters(returnUrl.searchParams)) {
    return '/';
  }

  return `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`;
}

function hasValidReturnParameters(query: URLSearchParams): boolean {
  const tab = query.get('tab');
  if (tab !== null && tab !== 'courts' && tab !== 'favourites') {
    return false;
  }

  if (!isValidPage(query.get('pageNumber'), true) || !isValidPage(query.get('favouritesPageNumber'), true)) {
    return false;
  }
  if (!isValidPage(query.get('pageSize'), false)) {
    return false;
  }

  const partialCourtName = query.get('partialCourtName');
  if (partialCourtName !== null && (partialCourtName.length > 250 || !COURT_NAME_PATTERN.test(partialCourtName))) {
    return false;
  }

  const regionId = query.get('regionId');
  if (regionId !== null && regionId !== '' && !isUuid(regionId)) {
    return false;
  }

  if (!isValidBoolean(query.get('includeClosed')) || !isValidBoolean(query.get('onlyServiceCentres'))) {
    return false;
  }

  const sortBy = query.get('sortBy');
  const sortOrder = query.get('sortOrder');
  return (
    (sortBy === null || sortBy === 'name' || sortBy === 'lastUpdated') &&
    (sortOrder === null || ((sortOrder === 'asc' || sortOrder === 'desc') && sortBy !== null))
  );
}

function isValidPage(value: string | null, allowZero: boolean): boolean {
  if (value === null) {
    return true;
  }

  if (!/^\d+$/.test(value)) {
    return false;
  }

  const parsed = Number(value);
  return parsed <= 1000 && (allowZero ? parsed >= 0 : parsed > 0);
}

function isValidBoolean(value: string | null): boolean {
  return value === null || value === 'true' || value === 'false' || value === 'on';
}
