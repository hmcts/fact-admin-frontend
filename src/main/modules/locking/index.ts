import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode } from 'axios';
import * as express from 'express';

import type { DataApiRequests as DataApiRequestsType } from '../../requests/DataApiRequests';
import { PATH_TO_PAGE_MAP } from '../../schemas/lockSchema';
import { Subject, SubjectType } from '../../schemas/subjectTypeSchema';
import { getFactUserId, isAdmin, isSuperAdmin } from '../authentication/authenticationHelper';

let dataApiRequests: DataApiRequestsType | undefined;

const LOCK_REQUIREMENTS_REGEX = /^\/(courts|service-centres)\/([^/]+)\/edit\/([^/]+)(?:\/.*)?$/;

const logger = Logger.getLogger('app-locking');

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

    logger.info(`LOCKING INTERCEPTOR: ${req.path}`);

    const userId = getFactUserId(req);
    res.locals.userId = userId;

    if (!this.shouldProcessRequest(req, userId)) {
      return next();
    }

    const lockDetails = this.getLockDetailsRequirements(req.path);
    if (!lockDetails) {
      logger.info('LOCKING INTERCEPTOR: CLEARING USER LOCKS');
      await dataApi.clearUserLocks(userId);
      return next();
    }

    const handled = await this.handleLockAcquisition(dataApi, userId, lockDetails, res);
    if (handled) {
      return;
    }

    logger.info('LOCKING INTERCEPTOR: LOCK ACQUIRED OR REFRESHED');
    return next();
  }

  private shouldProcessRequest(req: express.Request, userId: string | undefined): userId is string {
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

    logger.info(`LOCKING INTERCEPTOR: SUBJECT: ${subject}`);
    logger.info(`LOCKING INTERCEPTOR: SUBJECT ID: ${subjectId}`);
    logger.info(`LOCKING INTERCEPTOR: PAGE KEY: ${pageKey}`);

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
      logger.warn(`LOCKING INTERCEPTOR: NO PAGE FOR PAGE KEY ${details.pageKey}`);
      res.status(HttpStatusCode.BadRequest);
      res.render('lock-failed', {
        subject: subjectStr,
        page: (details.pageKey as string).toLowerCase().replaceAll('-', ' ')
      });
      return true;
    }

    logger.info(`LOCKING INTERCEPTOR: PAGE: ${page}`);
    logger.info(`LOCKING INTERCEPTOR: ACQUIRING LOCK: ${details.subject}/${details.subjectId}/${page}`);

    const lock = await dataApi.acquireLock(details.subject, details.subjectId, page, userId);

    if (typeof lock === 'number') {
      res.status(lock);
      const pageStr = (page as string).toLowerCase().replaceAll('_', ' ');
      if (lock === HttpStatusCode.Conflict) {
        const existingLock = await dataApi.getLock(details.subject, details.subjectId, page);
        res.render('lock-exists', {
          subject: subjectStr,
          page: pageStr,
          lock: existingLock,
        });
      } else {
        res.render('lock-failed', {
          subject: subjectStr,
          page: pageStr
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
