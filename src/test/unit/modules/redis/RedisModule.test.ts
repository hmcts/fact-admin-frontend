import config from 'config';
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
  set: (sessionId: string, session: unknown, callback?: (error?: unknown) => void) => Promise<void>;
  destroy: (sessionId: string, callback?: (error?: unknown) => void) => Promise<void>;
};

describe('RedisModule', () => {
  const originalRedisEnv = {
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_LOCAL: process.env.REDIS_LOCAL,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_PORT: process.env.REDIS_PORT,
  };
  const logger = {
    error: jest.fn(),
    errorEvent: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(() => {
    mockCreateClient.mockReset().mockReturnValue(mockRedisClient);
    for (const method of Object.values(mockRedisClient)) {
      method.mockReset();
    }
    mockRedisClient.connect.mockResolvedValue(undefined);
    process.env.REDIS_HOST = 'redis.test';
    process.env.REDIS_PASSWORD = 'password';
    process.env.REDIS_PORT = '6379';
    delete process.env.REDIS_LOCAL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    restoreEnvironmentVariable('REDIS_HOST', originalRedisEnv.REDIS_HOST);
    restoreEnvironmentVariable('REDIS_LOCAL', originalRedisEnv.REDIS_LOCAL);
    restoreEnvironmentVariable('REDIS_PASSWORD', originalRedisEnv.REDIS_PASSWORD);
    restoreEnvironmentVariable('REDIS_PORT', originalRedisEnv.REDIS_PORT);
  });

  test('creates a TLS Redis client from environment configuration', async () => {
    const app = enableRedis();

    await flushPromises();

    expect(mockCreateClient).toHaveBeenCalledWith({
      url: 'rediss://:password@redis.test:6379',
      pingInterval: 300000,
      socket: {
        connectTimeout: 10000,
      },
    });
    expect(app.locals.redisClient).toBe(mockRedisClient);
    expect(app.locals.sessionStore).toBeDefined();
    expect(logger.info).toHaveBeenCalledWith('Redis connected to redis.test:6379');
  });

  test('creates an insecure Redis client for the local environment', () => {
    process.env.REDIS_LOCAL = 'true';
    delete process.env.REDIS_PASSWORD;

    jest.spyOn(config, 'has').mockReturnValue(false);

    enableRedis();

    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'redis://:@redis.test:6379' })
    );
  });

  test('uses mounted Key Vault secrets when environment configuration is absent', () => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_PORT;
    jest.spyOn(config, 'has').mockReturnValue(true);
    jest.spyOn(config, 'get').mockImplementation(key => {
      const values: Record<string, string> = {
        'secrets.fact-kv.REDIS_HOST': 'redis.key-vault.test',
        'secrets.fact-kv.REDIS_PASSWORD': 'key-vault-password',
        'secrets.fact-kv.REDIS_PORT': '6380',
      };
      return values[key] as never;
    });

    enableRedis();

    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'rediss://:key-vault-password@redis.key-vault.test:6380' })
    );
  });

  test('rejects missing Redis host or port configuration', () => {
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    jest.spyOn(config, 'has').mockReturnValue(false);

    expect(() => enableRedis()).toThrow(
      'REDIS_HOST and REDIS_PORT must be set as environment variables or mounted Key Vault secrets'
    );
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  test('logs Redis client error', () => {
    enableRedis();
    const errorHandler = mockRedisClient.on.mock.calls.find(([eventName]) => eventName === 'error')?.[1];
    const clientError = new Error('Redis client unavailable');

    errorHandler(clientError);

    expect(logger.error).toHaveBeenCalledWith('Redis client error', clientError);
  });

  test('logs Redis connection failure', async () => {
    const connectionError = new Error('Redis connection failed');
    mockRedisClient.connect.mockRejectedValue(connectionError);

    enableRedis();
    await flushPromises();

    expect(logger.error).toHaveBeenCalledWith('Redis connect failed', connectionError);
  });

  test('retrieves stored sessions and reports missing sessions', async () => {
    const sessionStore = getSessionStore();
    const callback = jest.fn();
    mockRedisClient.get
      .mockResolvedValueOnce(JSON.stringify({ cookie: { maxAge: 1000 }, userId: 'user-id' }))
      .mockResolvedValueOnce(null);

    await sessionStore.get('stored-session', callback);
    await sessionStore.get('missing-session', callback);

    expect(mockRedisClient.get).toHaveBeenNthCalledWith(1, 'sess:stored-session');
    expect(mockRedisClient.get).toHaveBeenNthCalledWith(2, 'sess:missing-session');
    expect(callback).toHaveBeenNthCalledWith(1, undefined, { cookie: { maxAge: 1000 }, userId: 'user-id' });
    expect(callback).toHaveBeenNthCalledWith(2, undefined, null);
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

  test('reports malformed stored sessions through the callback', async () => {
    const sessionStore = getSessionStore();
    const callback = jest.fn();
    mockRedisClient.get.mockResolvedValue('{not-json');

    await sessionStore.get('malformed-session', callback);

    expect(logger.errorEvent).toHaveBeenCalledWith(
      'redis.session.operation_failed',
      { operation: 'get' },
      expect.any(SyntaxError)
    );
    expect(callback).toHaveBeenCalledWith(expect.any(SyntaxError));
  });

  test('deletes a session instead of storing it when its max age has expired', async () => {
    const sessionStore = getSessionStore();
    const callback = jest.fn();

    await sessionStore.set('expired-session', { cookie: { maxAge: 0 } }, callback);

    expect(mockRedisClient.del).toHaveBeenCalledWith('sess:expired-session');
    expect(mockRedisClient.set).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith();
  });

  test('stores a session with the configured expiry when it has a positive max age', async () => {
    const sessionStore = getSessionStore();
    const session = { cookie: { maxAge: 5000 }, userId: 'user-id' };

    await sessionStore.set('expiring-session', session);

    expect(mockRedisClient.set).toHaveBeenCalledWith('sess:expiring-session', JSON.stringify(session), {
      expiration: {
        type: 'EX',
        value: 60 * 60,
      },
    });
  });

  test.each([{}, null, 'session-value'])(
    'stores %p without an expiry when no numeric max age is present',
    async session => {
      const sessionStore = getSessionStore();

      await sessionStore.set('session-without-expiry', session);

      expect(mockRedisClient.set).toHaveBeenCalledWith('sess:session-without-expiry', JSON.stringify(session));
    }
  );

  test('reports session write failures through the callback', async () => {
    const writeError = new Error('Redis write failed');
    const sessionStore = getSessionStore();
    const callback = jest.fn();
    mockRedisClient.set.mockRejectedValue(writeError);

    await sessionStore.set('failed-session', {}, callback);

    expect(logger.errorEvent).toHaveBeenCalledWith('redis.session.operation_failed', { operation: 'set' }, writeError);
    expect(callback).toHaveBeenCalledWith(writeError);
  });

  test('destroys sessions and invokes the optional callback', async () => {
    const sessionStore = getSessionStore();
    const callback = jest.fn();

    await sessionStore.destroy('session-to-destroy', callback);

    expect(mockRedisClient.del).toHaveBeenCalledWith('sess:session-to-destroy');
    expect(callback).toHaveBeenCalledWith();
  });

  test('reports session destruction failures through the callback', async () => {
    const destroyError = new Error('Redis delete failed');
    const sessionStore = getSessionStore();
    const callback = jest.fn();
    mockRedisClient.del.mockRejectedValue(destroyError);

    await sessionStore.destroy('failed-session', callback);

    expect(logger.errorEvent).toHaveBeenCalledWith(
      'redis.session.operation_failed',
      { operation: 'destroy' },
      destroyError
    );
    expect(callback).toHaveBeenCalledWith(destroyError);
  });

  function enableRedis(): Application {
    const app = { locals: {} } as Application;
    new RedisModule(logger).enableFor(app);
    return app;
  }

  function getSessionStore(): SessionStore {
    return enableRedis().locals.sessionStore as SessionStore;
  }

  function flushPromises(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve));
  }

  function restoreEnvironmentVariable(name: string, value: string | undefined): void {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});
