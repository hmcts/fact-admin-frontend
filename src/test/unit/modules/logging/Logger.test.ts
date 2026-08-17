const delegateLogger = {
  silly: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
const emit = jest.fn();
const getOpenTelemetryLogger = jest.fn().mockReturnValue({ emit });

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue(delegateLogger),
  },
}));

jest.mock('@opentelemetry/api-logs', () => ({
  SeverityNumber: {
    TRACE: 1,
    DEBUG: 5,
    INFO: 9,
    WARN: 13,
    ERROR: 17,
  },
  logs: {
    getLogger: getOpenTelemetryLogger,
  },
}));

import { Logger } from '../../../../main/modules/logging';

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('writes errors to the console logger and OpenTelemetry', () => {
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
    expect(getOpenTelemetryLogger).toHaveBeenCalledWith('fact-admin-frontend');
    expect(emit).toHaveBeenCalledWith({
      body: expect.stringContaining(
        'Error fetching accessibility options: name=ZodError, message=Data API response failed schema validation'
      ),
      severityNumber: 17,
      severityText: 'ERROR',
      attributes: {
        'logger.name': 'app',
      },
    });
    expect(emit.mock.calls[0][0].body).toContain(
      'issues=[code=invalid_type, path=accessibleToiletDescriptionCy, message=Invalid input: expected string, received null]'
    );
  });

  test('does not interrupt console logging if telemetry throws', () => {
    getOpenTelemetryLogger.mockImplementationOnce(() => {
      throw new Error('telemetry unavailable');
    });

    expect(() => Logger.getLogger('app').warn('Application warning')).not.toThrow();
    expect(delegateLogger.warn).toHaveBeenCalledWith('Application warning');
  });
});
