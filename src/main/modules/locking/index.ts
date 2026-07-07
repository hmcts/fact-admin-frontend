import { Logger } from '@hmcts/nodejs-logging';
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
          // user is heading towards a page that requires a lock, so check if they
          // have the lock and if not, try to acquire it

          const subject = matches[1] === 'courts' ? SubjectType.COURT : SubjectType.SERVICE_CENTRE;
          const subjectId = matches[2];
          const pageKey = matches[3];

          logger.info(`LOCKING INTERCEPTOR SUBJECT: ${subject}`);
          logger.info(`LOCKING INTERCEPTOR SUBJECT ID: ${subjectId}`);
          logger.info(`LOCKING INTERCEPTOR PAGE KEY: ${pageKey}`);

          const page = PATH_TO_PAGE_MAP[pageKey];
          if (page) {
            logger.info(`LOCKING INTERCEPTOR PAGE: ${page}`);

            let courtLock = await dataApi.getLock(subject, subjectId, page);

            // deal with the case where the locking details can't be retrieved
            if (typeof courtLock === 'number') {
              // show unable to lock page
              res.status(courtLock);
              return res.render('court-lock-failed');
            }

            if (courtLock === null) {
              // TODO: try and acquire the lock
              logger.info(`LOCKING INTERCEPTOR ACQUIRE LOCK FOR COURT: ${subjectId} and PAGE: ${page}`);
              courtLock = await dataApi.acquireLock(subject, subjectId, page, userId);
              if (typeof courtLock === 'number') {
                // didn't get the lock, but we need to decide if we didn't get it for failure reasons
                // or because someone beat us to it
                courtLock = await dataApi.getLock(subject, subjectId, page);
                if (typeof courtLock === 'number' || courtLock === null) {
                  // show unable to lock page
                  res.status(500);
                  return res.render('court-lock-failed');
                } else {
                  res.status(403);
                  return res.render('court-lock-exists', courtLock);
                }
              }
            } else if (courtLock?.userId === userId) {
              // we already have the page locked, just carry on
              // TODO: check the timestamp
              logger.info(`LOCKING INTERCEPTOR ALREADY LOCKED FOR COURT: ${subjectId} and PAGE: ${page}`);
            } else {
              res.status(403);
              return res.render('court-lock-exists', courtLock);
            }
          }
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
