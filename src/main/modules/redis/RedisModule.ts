import config from 'config';
import type { Application } from 'express';
import { type RedisClientType, createClient } from 'redis';

type Logger = {
  info: (message: string) => void;
  error: (message: string, error?: unknown) => void;
};

type SessionStoreCallback<T = unknown> = (error?: unknown, session?: T | null) => void;

type RedisSessionPayload = {
  cookie?: {
    maxAge?: number;
  };
};

class RedisSessionStore {
  private readonly prefix = 'sess:';

  public constructor(private readonly client: RedisClientType) {}

  public async get(sessionId: string, callback: SessionStoreCallback): Promise<void> {
    try {
      const session = await this.client.get(this.getKey(sessionId));
      callback(undefined, session ? JSON.parse(session) : null);
    } catch (error) {
      callback(error);
    }
  }

  public async set(sessionId: string, session: unknown, callback?: SessionStoreCallback): Promise<void> {
    try {
      const maxAge = this.getMaxAge(session);

      if (maxAge !== undefined && maxAge <= 0) {
        await this.client.del(this.getKey(sessionId));
      } else if (maxAge) {
        await this.client.set(this.getKey(sessionId), JSON.stringify(session), {
          expiration: {
            type: 'EX',
            value: 60 * 60,
          },
        });
      } else {
        await this.client.set(this.getKey(sessionId), JSON.stringify(session));
      }

      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  public async destroy(sessionId: string, callback?: SessionStoreCallback): Promise<void> {
    try {
      await this.client.del(this.getKey(sessionId));
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  private getKey(sessionId: string): string {
    return `${this.prefix}${sessionId}`;
  }

  private getMaxAge(session: unknown): number | undefined {
    if (!session || typeof session !== 'object') {
      return undefined;
    }

    const maxAge = (session as RedisSessionPayload).cookie?.maxAge;
    return typeof maxAge === 'number' ? maxAge : undefined;
  }
}

export class RedisModule {
  public constructor(private readonly logger: Logger) {}

  public enableFor(app: Application): void {
    const host =
      process.env.REDIS_HOST ||
      (config.has('secrets.fact-kv.REDIS_HOST') ? config.get<string>('secrets.fact-kv.REDIS_HOST') : '');
    const password =
      process.env.REDIS_PASSWORD ||
      (config.has('secrets.fact-kv.REDIS_PASSWORD') ? config.get<string>('secrets.fact-kv.REDIS_PASSWORD') : '');
    const portValue =
      process.env.REDIS_PORT ||
      (config.has('secrets.fact-kv.REDIS_PORT') ? config.get<string>('secrets.fact-kv.REDIS_PORT') : '');
    const port = Number(portValue);

    if (!host || !portValue) {
      throw new Error('REDIS_HOST and REDIS_PORT must be set as environment variables or mounted Key Vault secrets');
    }

    const client: RedisClientType = createClient({
      socket: {
        host,
        port,
        connectTimeout: 10000,
      },
      password,
    });

    client.on('error', error => {
      this.logger.error('Redis client error', error);
    });

    void client
      .connect()
      .then(() => {
        this.logger.info(`Redis connected to ${host}:${port}`);
      })
      .catch(error => {
        this.logger.error('Redis connect failed', error);
      });

    app.locals.redisClient = client;
    app.locals.sessionStore = new RedisSessionStore(client);
  }
}
