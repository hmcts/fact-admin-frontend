import config from 'config';
import type { Application } from 'express';
import { createClient } from 'redis';

import { RedisModule } from '../../../../main/modules/redis/RedisModule';

jest.mock('config', () => ({
  get: jest.fn(),
  has: jest.fn(),
}));

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('RedisModule', () => {
  const mockConfig = config as unknown as {
    get: jest.Mock;
    has: jest.Mock;
  };
  const mockCreateClient = createClient as jest.Mock;
  const client = {
    connect: jest.fn(),
    on: jest.fn(),
  };
  const logger = {
    error: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_PORT;
    client.connect.mockResolvedValue(undefined);
    mockCreateClient.mockReturnValue(client);
  });

  it('uses mounted Redis secrets when environment variables are not available', () => {
    mockConfig.has.mockImplementation((path: string) => path.startsWith('secrets.fact-kv.'));
    mockConfig.get.mockImplementation((path: string) => {
      const values: Record<string, string> = {
        'secrets.fact-kv.REDIS_HOST': 'redis.secret.internal',
        'secrets.fact-kv.REDIS_PASSWORD': 'secret-password',
        'secrets.fact-kv.REDIS_PORT': '6380',
      };

      return values[path];
    });

    new RedisModule(logger).enableFor({ locals: {} } as Application);

    expect(mockCreateClient).toHaveBeenCalledWith({
      password: 'secret-password',
      socket: {
        connectTimeout: 10000,
        host: 'redis.secret.internal',
        port: 6380,
      },
    });
  });

  it('falls back to local Redis config when mounted secrets are not available', () => {
    mockConfig.has.mockReturnValue(false);
    mockConfig.get.mockImplementation((path: string) => {
      const values: Record<string, string> = {
        'redis.host': '127.0.0.1',
        'redis.password': '',
        'redis.port': '6379',
      };

      return values[path];
    });

    new RedisModule(logger).enableFor({ locals: {} } as Application);

    expect(mockCreateClient).toHaveBeenCalledWith({
      password: '',
      socket: {
        connectTimeout: 10000,
        host: '127.0.0.1',
        port: 6379,
      },
    });
  });
});
