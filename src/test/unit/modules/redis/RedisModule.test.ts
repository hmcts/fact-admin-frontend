import type { Application } from 'express';

const mockRedisClient = {
  connect: jest.fn(),
  del: jest.fn(),
  get: jest.fn(),
  on: jest.fn(),
  set: jest.fn(),
};
const mockCreateClient = jest.fn(() => mockRedisClient);

jest.mock('redis', () => ({
  createClient: mockCreateClient,
}));

import { RedisModule } from '../../../../main/modules/redis/RedisModule';

type SessionStore = {
  get: (sessionId: string, callback: (error?: unknown, session?: unknown) => void) => Promise<void>;
};

describe('RedisModule', () => {
  const logger = {
    error: jest.fn(),
    errorEvent: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient.connect.mockResolvedValue(undefined);
    process.env.REDIS_HOST = 'redis.test';
    process.env.REDIS_PASSWORD = 'password';
    process.env.REDIS_PORT = '6379';
  });

  test('logs Redis session read failures without including the session id', async () => {
    const readError = new Error('Redis unavailable');
    mockRedisClient.get.mockRejectedValue(readError);
    const app = { locals: {} } as Application;

    new RedisModule(logger).enableFor(app);
    const sessionStore = app.locals.sessionStore as SessionStore;
    const callback = jest.fn();

    await sessionStore.get('do-not-log-this-session-id', callback);

    expect(logger.errorEvent).toHaveBeenCalledWith('redis.session.operation_failed', { operation: 'get' }, readError);
    expect(callback).toHaveBeenCalledWith(readError);
    expect(JSON.stringify(logger.errorEvent.mock.calls)).not.toContain('do-not-log-this-session-id');
  });
});
