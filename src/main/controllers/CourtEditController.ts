import { GET, route } from 'awilix-express';
import { HttpStatusCode } from 'axios';
import { Request, Response } from 'express';

import { DataApiRequests } from '../requests/DataApiRequests';
import { SubjectType } from '../schemas/subjectTypeSchema';
import { LockService } from '../services/LockService';
import { isUuid, parseNumber } from '../utils/valueParsers';

import { buildEditBreadcrumbs } from './helpers/breadcrumbs';

const dataApiRequests = new DataApiRequests();
const courtLockService = new LockService(dataApiRequests);

@route('/courts/:courtId/edit')
export default class CourtEditController {
  @GET()
  public async get(req: Request, res: Response): Promise<void> {
    const { courtId } = req.params;
    const resolvedCourtId = Array.isArray(courtId) ? courtId[0] : courtId;

    if (!resolvedCourtId || !isUuid(resolvedCourtId)) {
      res.status(HttpStatusCode.NotFound);
      res.render('court-not-found');
      return;
    }

    const courtResponse = await dataApiRequests.getCourtById(resolvedCourtId);

    if (courtResponse === HttpStatusCode.NotFound) {
      res.status(HttpStatusCode.NotFound);
      res.render('court-not-found');
      return;
    }

    if (typeof courtResponse === 'number') {
      res.status(courtResponse);
      res.render('error');
      return;
    }

    const courtLocks = await courtLockService.getLocks(SubjectType.COURT, resolvedCourtId);

    if (typeof courtLocks === 'number') {
      res.status(courtLocks);
      res.render('error');
      return;
    }

    res.render('court-edit', {
      breadcrumbs: buildEditBreadcrumbs(resolvedCourtId, courtResponse.name),
      courtId: resolvedCourtId,
      courtName: courtResponse.name,
      pageTitle: `Editing - ${courtResponse.name}`,
      courtLocks,
      timeoutMins: this.getTimeoutMinsFromQuery(req.query),
    });
  }

  private getTimeoutMinsFromQuery(query: Request['query']): number | undefined {
    const timeoutMins = parseNumber(query?.timeout, -1);
    return timeoutMins === -1 ? undefined : timeoutMins;
  }
}
