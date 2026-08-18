import type { Express, NextFunction, Request, Response } from 'express';

import { getFactUser } from '../authentication/authenticationHelper';
import { LogProperties, Logger } from '../logging';

type EventLogger = {
  infoEvent: (eventName: string, properties?: LogProperties) => void;
  warnEvent: (eventName: string, properties?: LogProperties) => void;
  errorEvent: (eventName: string, properties?: LogProperties) => void;
};

const IDENTIFIED_RESOURCES = new Set(['approvals', 'audits', 'courts', 'service-centres', 'users']);
const STATIC_RESOURCE_CHILDREN = new Map([['audits', new Set(['download'])]]);
const UUID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NUMBER_SEGMENT = /^\d+$/;

export class RequestLogging {
  public constructor(private readonly logger: EventLogger = Logger.getLogger('http')) {}

  public enableFor(app: Express): void {
    app.use(this.handleRequest.bind(this));
  }

  private handleRequest(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    res.once('finish', () => {
      if (res.statusCode < 400) {
        return;
      }

      const factUser = getFactUser(req);
      const properties: LogProperties = {
        durationMs: elapsedMilliseconds(startedAt),
        method: req.method,
        requestPath: normaliseRequestPath(req.path),
        role: factUser?.role,
        statusCode: res.statusCode,
      };

      if (res.statusCode >= 500) {
        this.logger.errorEvent('http.request.completed', properties);
      } else if ([401, 403, 409, 429].includes(res.statusCode)) {
        this.logger.warnEvent('http.request.completed', properties);
      } else {
        this.logger.infoEvent('http.request.completed', properties);
      }
    });

    next();
  }
}

function elapsedMilliseconds(startedAt: bigint): number {
  return Number((process.hrtime.bigint() - startedAt) / BigInt(1_000_000));
}

export function normaliseRequestPath(requestPath: string): string {
  const segments = requestPath.split('/');

  return segments
    .map((segment, index) => {
      const previousSegment = segments[index - 1];
      const isResourceIdentifier =
        IDENTIFIED_RESOURCES.has(previousSegment) && !STATIC_RESOURCE_CHILDREN.get(previousSegment)?.has(segment);
      const isFavouriteIdentifier = segments[index - 2] === 'favourites';

      if (UUID_SEGMENT.test(segment) || NUMBER_SEGMENT.test(segment) || isResourceIdentifier || isFavouriteIdentifier) {
        return ':id';
      }

      return segment.length > 64 ? ':value' : segment;
    })
    .join('/');
}
