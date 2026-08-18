const childLogger = {
  log: jest.fn(),
};
const rootLogger = {
  child: jest.fn().mockReturnValue(childLogger),
};
const createLogger = jest.fn().mockReturnValue(rootLogger);
const consoleTransport = jest.fn();

jest.mock('winston', () => ({
  createLogger,
  format: {
    combine: jest.fn(),
    json: jest.fn(),
    printf: jest.fn(),
    timestamp: jest.fn(),
  },
  transports: {
    Console: consoleTransport,
  },
}));

import { Logger } from '../../../../main/modules/logging';

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('writes formatted errors through Winston', () => {
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

    expect(childLogger.log).toHaveBeenCalledWith(
      'error',
      expect.stringContaining(
        'Error fetching accessibility options: name=ZodError, message=Data API response failed schema validation'
      )
    );
    expect(childLogger.log.mock.calls[0][1]).toContain(
      'issues=[code=invalid_type, path=accessibleToiletDescriptionCy, message=Invalid input: expected string, received null]'
    );
  });

  test('caches named child loggers', () => {
    const first = Logger.getLogger('audit-service');
    const second = Logger.getLogger('audit-service');

    expect(first).toBe(second);
    expect(rootLogger.child).toHaveBeenCalledTimes(1);
    expect(rootLogger.child).toHaveBeenCalledWith({
      label: 'audit-service',
      loggerName: 'audit-service',
    });
  });
});
