const delegateLogger = {
  silly: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
const trackTrace = jest.fn();

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue(delegateLogger),
  },
}));

import { Logger, setAppInsightsClient } from '../../../../main/modules/logging';

describe('Logger', () => {
  beforeAll(() => {
    setAppInsightsClient({ trackTrace });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('writes errors to the console logger and Application Insights', () => {
    const logger = Logger.getLogger('app');
    const details = {
      name: 'ZodError',
      message: 'Data API response failed schema validation',
      issueCount: 1,
      issues: [
        {
          code: 'invalid_type',
          path: 'accessibleToiletDescriptionCy',
          message: 'Invalid input: expected string, received null',
        },
      ],
    };

    logger.error('Error fetching accessibility options:', details);

    expect(delegateLogger.error).toHaveBeenCalledWith('Error fetching accessibility options:', details);
    expect(trackTrace).toHaveBeenCalledWith({
      message: expect.stringContaining(
        'Error fetching accessibility options: name=ZodError, message=Data API response failed schema validation'
      ),
      severity: 'Error',
      properties: {
        loggerName: 'app',
      },
    });
    expect(trackTrace.mock.calls[0][0].message).toContain(
      'issues=[code=invalid_type, path=accessibleToiletDescriptionCy, message=Invalid input: expected string, received null]'
    );
  });

  test('does not interrupt console logging if telemetry throws', () => {
    trackTrace.mockImplementationOnce(() => {
      throw new Error('telemetry unavailable');
    });

    expect(() => Logger.getLogger('app').warn('Application warning')).not.toThrow();
    expect(delegateLogger.warn).toHaveBeenCalledWith('Application warning');
  });

  test('writes structured event properties to the console and Application Insights', () => {
    const logger = Logger.getLogger('http');

    logger.infoEvent('http.request.completed', {
      durationMs: 12,
      method: 'GET',
      requestPath: '/courts/:id/edit',
      statusCode: 404,
      unused: undefined,
    });

    expect(delegateLogger.info).toHaveBeenCalledWith(
      'http.request.completed: durationMs=12, method=GET, requestPath=/courts/:id/edit, statusCode=404'
    );
    expect(trackTrace).toHaveBeenCalledWith({
      message: 'http.request.completed: durationMs=12, method=GET, requestPath=/courts/:id/edit, statusCode=404',
      severity: 'Information',
      properties: {
        durationMs: '12',
        eventName: 'http.request.completed',
        loggerName: 'http',
        method: 'GET',
        requestPath: '/courts/:id/edit',
        statusCode: '404',
      },
    });
  });

  test.each([
    ['silly', 'Verbose'],
    ['debug', 'Verbose'],
    ['verbose', 'Verbose'],
    ['info', 'Information'],
  ] as const)('writes %s messages to the console logger and Application Insights', (level, severity) => {
    const logger = Logger.getLogger(`level-${level}`);

    logger[level]('Log message', 12);

    expect(delegateLogger[level]).toHaveBeenCalledWith('Log message', 12);
    expect(trackTrace).toHaveBeenCalledWith({
      message: 'Log message 12',
      severity,
      properties: {
        loggerName: `level-${level}`,
      },
    });
  });

  test.each([
    ['infoEvent', 'info', 'Information'],
    ['warnEvent', 'warn', 'Warning'],
    ['errorEvent', 'error', 'Error'],
  ] as const)('writes %s without optional properties', (eventMethod, delegateMethod, severity) => {
    const logger = Logger.getLogger(`event-${delegateMethod}`);

    logger[eventMethod]('application.event');

    expect(delegateLogger[delegateMethod]).toHaveBeenCalledWith('application.event');
    expect(trackTrace).toHaveBeenCalledWith({
      message: 'application.event',
      severity,
      properties: {
        eventName: 'application.event',
        loggerName: `event-${delegateMethod}`,
      },
    });
  });

  test('formats errors, dates, circular values, null, and undefined for telemetry', () => {
    const logger = Logger.getLogger('values');
    const errorWithStack = new Error('with stack');
    errorWithStack.stack = 'test stack';
    const errorWithoutStack = new Error('without stack');
    errorWithoutStack.stack = '';
    const circularValue: { name: string; self?: unknown } = { name: 'circular' };
    circularValue.self = circularValue;

    logger.info(
      errorWithStack,
      errorWithoutStack,
      new Date('2026-09-02T12:00:00.000Z'),
      circularValue,
      null,
      undefined
    );

    expect(trackTrace).toHaveBeenCalledWith({
      message: 'test stack Error: without stack 2026-09-02T12:00:00.000Z name=circular, self=[Circular] null undefined',
      severity: 'Information',
      properties: {
        loggerName: 'values',
      },
    });
  });

  test('does not interrupt event logging if telemetry throws', () => {
    const logger = Logger.getLogger('events');
    const error = new Error('save failed');
    trackTrace.mockImplementationOnce(() => {
      throw new Error('telemetry unavailable');
    });

    expect(() => logger.errorEvent('court.save.failed', { stage: 'save' }, error)).not.toThrow();
    expect(delegateLogger.error).toHaveBeenCalledWith('court.save.failed: stage=save', error);
  });
});
