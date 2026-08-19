import { EventEmitter } from 'node:events';

import type { Express, NextFunction, Request, RequestHandler, Response } from 'express';

import { RequestLogging, normaliseRequestPath } from '../../../../main/modules/request-logging';

describe('RequestLogging', () => {
  const logger = {
    errorEvent: jest.fn(),
    infoEvent: jest.fn(),
    warnEvent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    [404, 'infoEvent'],
    [403, 'warnEvent'],
    [409, 'warnEvent'],
    [500, 'errorEvent'],
  ] as const)('logs a %i response at the appropriate level', (statusCode, method) => {
    completeRequest(statusCode, '/courts/not-a-uuid/edit/general');

    expect(logger[method]).toHaveBeenCalledWith('http.request.completed', {
      durationMs: expect.any(Number),
      method: 'GET',
      requestPath: '/courts/:id/edit/general',
      role: undefined,
      statusCode,
    });
  });

  test('does not log successful responses', () => {
    completeRequest(200, '/health');

    expect(logger.infoEvent).not.toHaveBeenCalled();
    expect(logger.warnEvent).not.toHaveBeenCalled();
    expect(logger.errorEvent).not.toHaveBeenCalled();
  });

  test.each([
    ['/courts/not-a-uuid/edit/address', '/courts/:id/edit/address'],
    ['/service-centres/11111111-1111-4111-8111-111111111111/edit', '/service-centres/:id/edit'],
    ['/approvals/123/undo', '/approvals/:id/undo'],
    ['/audits/download', '/audits/download'],
    ['/favourites/COURT/not-a-uuid', '/favourites/COURT/:id'],
    [`/unknown/${'x'.repeat(65)}`, '/unknown/:value'],
  ])('normalises identifiers in %s', (requestPath, expected) => {
    expect(normaliseRequestPath(requestPath)).toBe(expected);
  });

  function completeRequest(statusCode: number, path: string): void {
    const app = { use: jest.fn() } as unknown as Express;
    new RequestLogging(logger).enableFor(app);
    const middleware = (app.use as jest.Mock).mock.calls[0][0] as RequestHandler;
    const req = { method: 'GET', path } as Request;
    const res = new EventEmitter() as Response & EventEmitter;
    res.statusCode = statusCode;

    middleware(req, res, jest.fn() as NextFunction);
    res.emit('finish');
  }
});
