import { Logger } from '@hmcts/nodejs-logging';
import { HttpStatusCode } from 'axios';
import * as express from 'express';

import type { DataApiRequests as DataApiRequestsType } from '../../requests/DataApiRequests';
import { PATH_TO_PAGE_MAP } from '../../schemas/lockSchema';
import { SubjectType } from '../../schemas/subjectTypeSchema';
import { getFactUserId, isAdmin, isSuperAdmin } from '../authentication/authenticationHelper';

let dataApiRequests: DataApiRequestsType | undefined;

const LOCK_DETAILS_REGEX = /^\/(courts|service-centres)\/([^/]+)\/edit\/([^/]+)(?:\/.*)?$/;

const logger = Logger.getLogger('app-locking');

export class LockingInterceptor {
  public enableFor(app: express.Express): void {
    app.use(async (req, res, next) => {
      const dataApi = await getDataApiRequests();
      logger.info(`LOCKING INTERCEPTOR: ${req.path}`);
      const userId = getFactUserId(req);
      res.locals.userId = userId;
      if (userId && (isAdmin(req) || isSuperAdmin(req))) {
        const matches = req.path.match(LOCK_DETAILS_REGEX);
        if (matches?.length === 4) {
          // user is heading towards a page that requires a lock
          const subject = matches[1] === 'courts' ? SubjectType.COURT : SubjectType.SERVICE_CENTRE;
          const subjectId = matches[2];
          const pageKey = matches[3];

          logger.info(`LOCKING INTERCEPTOR: SUBJECT: ${subject}`);
          logger.info(`LOCKING INTERCEPTOR: SUBJECT ID: ${subjectId}`);
          logger.info(`LOCKING INTERCEPTOR: PAGE KEY: ${pageKey}`);

          const page = PATH_TO_PAGE_MAP[pageKey];
          if (page) {
            logger.info(`LOCKING INTERCEPTOR: PAGE: ${page}`);
            logger.info(`LOCKING INTERCEPTOR: ACQUIRING LOCK: ${subject}/${subjectId}/${page}`);
            const courtLock = await dataApi.acquireLock(subject, subjectId, page, userId);

            // if we didn't get the lock, we'll have a status code. If it's CONFLICT (409) that means
            // that someone else has the lock. Any other status is a locking failure.
            if (typeof courtLock === 'number') {
              res.status(courtLock);
              return res.render(courtLock === HttpStatusCode.Conflict ? 'lock-exists' : 'lock-failed');
            }
          } else {
            logger.warn(`LOCKING INTERCEPTOR: NO PAGE FOR PAGE KEY ${pageKey}`);
            res.status(HttpStatusCode.BadRequest);
            return res.render('lock-failed');
          }
          logger.info('LOCKING INTERCEPTOR: LOCK ACQUIRED OR REFRESHED');
        } else {
          // user is heading away from a page that requires a lock
          logger.info('LOCKING INTERCEPTOR: CLEARING USER LOCKS');
          await dataApi.clearUserLocks(userId);
        }
      }
      return next();
    });
  }
}

async function getDataApiRequests(): Promise<DataApiRequestsType> {
  if (!dataApiRequests) {
    const { DataApiRequests } = await import('../../requests/DataApiRequests');
    dataApiRequests = new DataApiRequests();
  }
  return dataApiRequests;
}
