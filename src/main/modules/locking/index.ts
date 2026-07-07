import { HttpStatusCode } from 'axios';
import * as express from 'express';

import type { DataApiRequests as DataApiRequestsType } from '../../requests/DataApiRequests';
import { PATH_TO_PAGE_MAP } from '../../schemas/lockSchema';
import { Subject, SubjectType } from '../../schemas/subjectTypeSchema';
import { getFactUserId, isAdmin, isSuperAdmin } from '../authentication/authenticationHelper';

let dataApiRequests: DataApiRequestsType | undefined;

const LOCK_REQUIREMENTS_REGEX = /^\/(courts|service-centres)\/([^/]+)\/edit\/([^/]+)(?:\/.*)?$/;

type LockRequirements = {
  subject: Subject;
  subjectId: string;
  pageKey: string;
};

type DataApiProvider = () => Promise<DataApiRequestsType>;

export class LockingInterceptor {
  public constructor(private readonly getDataApi: DataApiProvider = getDataApiRequests) {}

  public enableFor(app: express.Express): void {
    app.use(this.handleRequest.bind(this));
  }

  private async handleRequest(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
    const dataApi = await this.getDataApi();
    const userId = getFactUserId(req);
    res.locals.userId = undefined;
    res.locals.timeoutDialogConfig = undefined;

    // check that we're interested in even processing this request (i.e. user is admin or super admin)
    if (!this.shouldProcessRequest(req, userId)) {
      return next();
    }

    res.locals.userId = userId;

    // figure out what it is we're trying to lock, if anything
    const lockDetails = this.getLockDetailsRequirements(req.path);
    if (!lockDetails) {
      // As we only maintain a single lock for a user based on the last page they visit,
      // if they navigate away from a lockable resource, we will clear their locks. If they
      // are still editing (e.g. they have multiple tabs open) then the lock will need to be
      // re-acquired when they refresh or save.
      await dataApi.clearUserLocks(userId);
      return next();
    }

    // attempt to acquire the lock, and if we can't, render the appropriate error page
    const errorPageRendered = await this.handleLockAcquisition(dataApi, userId, lockDetails, res);
    if (errorPageRendered) {
      return;
    }

    // setup timeout dialog config so that the dialog shows up.
    res.locals.timeoutDialogConfig = {
      subject: (lockDetails.subject as string).toLowerCase().replaceAll('_', ' '),
      timeout: 900,
      countdown: 120,
      timeoutUrl:
        lockDetails.subject === SubjectType.SERVICE_CENTRE
          ? `/service-centres/${lockDetails.subjectId}/edit`
          : `/courts/${lockDetails.subjectId}/edit`,
    };

    // we have the lock, so we can move on
    return next();
  }

  private shouldProcessRequest(req: express.Request, userId: string | undefined): userId is string {
    // For now, we're only interested in processing this request if we have a valid
    // user, and that user is either an admin or a super admin
    return Boolean(userId && (isAdmin(req) || isSuperAdmin(req)));
  }

  private getLockDetailsRequirements(path: string): LockRequirements | undefined {
    const matches = path.match(LOCK_REQUIREMENTS_REGEX);
    if (matches?.length !== 4) {
      return undefined;
    }

    const subject = matches[1] === 'courts' ? SubjectType.COURT : SubjectType.SERVICE_CENTRE;
    const subjectId = matches[2];
    const pageKey = matches[3];

    return { subject, subjectId, pageKey };
  }

  private async handleLockAcquisition(
    dataApi: DataApiRequestsType,
    userId: string,
    details: LockRequirements,
    res: express.Response
  ): Promise<boolean> {
    const page = PATH_TO_PAGE_MAP[details.pageKey];
    const subjectStr = (details.subject as string).toLowerCase().replaceAll('_', ' ');
    if (!page) {
      // we don't have a page mapping for that key so fail the lock
      res.status(HttpStatusCode.BadRequest);
      res.render('lock-failed', {
        subject: subjectStr,
        page: details.pageKey.toLowerCase().replaceAll('-', ' '),
      });
      return true;
    }

    // just attempt the acquire the lock, we only need to do anything if we fail
    const lock = await dataApi.acquireLock(details.subject, details.subjectId, page, userId);

    if (typeof lock === 'number') {
      res.status(lock);
      const pageStr = (page as string).toLowerCase().replaceAll('_', ' ');
      if (lock === HttpStatusCode.Conflict) {
        // someone else has the lock to retrieve it and render the already locked page.
        const existingLock = await dataApi.getLock(details.subject, details.subjectId, page);
        res.render('lock-exists', {
          subject: subjectStr,
          page: pageStr,
          lock: existingLock,
        });
      } else {
        // something else went wrong, so just render the generic lock failed page
        res.render('lock-failed', {
          subject: subjectStr,
          page: pageStr,
        });
      }
      return true;
    }

    return false;
  }
}

async function getDataApiRequests(): Promise<DataApiRequestsType> {
  if (!dataApiRequests) {
    const { DataApiRequests } = await import('../../requests/DataApiRequests');
    dataApiRequests = new DataApiRequests();
  }
  return dataApiRequests;
}
