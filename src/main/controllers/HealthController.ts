import { GET, route } from 'awilix-express';
import { Request, Response } from 'express';

import { app as myApp } from '../app';

/* eslint-disable @typescript-eslint/no-require-imports */
const healthcheck = require('@hmcts/nodejs-healthcheck');
const outputs = require('@hmcts/nodejs-healthcheck/healthcheck/outputs');
const healthRoutes = require('@hmcts/nodejs-healthcheck/healthcheck/routes');
/* eslint-enable @typescript-eslint/no-require-imports */

@route('/health')
export default class HealthController {
  private readonly redisHealthCheckTimeoutMs = 2000;

  private readonly healthCheckConfig = {
    checks: {
      redis: healthcheck.raw(() => this.redisCheck()),
    },
    readinessChecks: {
      redis: healthcheck.raw(() => this.redisCheck()),
      shutdownCheck: healthcheck.raw(() => {
        return this.shutdownCheck() ? healthcheck.down() : healthcheck.up();
      }),
    },
  };

  @GET()
  public get(req: Request, res: Response): void {
    return healthRoutes.configure(this.healthCheckConfig)(req, res);
  }

  @route('/liveness')
  @GET()
  public liveness(_req: Request, res: Response): void {
    res.json(outputs.status(outputs.UP));
  }

  @route('/readiness')
  @GET()
  public readiness(req: Request, res: Response): void {
    return healthRoutes.checkReadiness(this.healthCheckConfig.readinessChecks)(req, res);
  }

  private shutdownCheck(): boolean {
    return myApp.locals.shutdown;
  }

  private async redisCheck(): Promise<unknown> {
    try {
      const redisClient = myApp.locals.redisClient;

      if (!redisClient) {
        return healthcheck.down({ message: 'Redis client is not configured' });
      }

      const response = await this.withTimeout(
        redisClient.ping(),
        this.redisHealthCheckTimeoutMs,
        `Redis ping timed out after ${this.redisHealthCheckTimeoutMs}ms`
      );

      return response === 'PONG'
        ? healthcheck.up()
        : healthcheck.down({ message: `Redis ping returned ${String(response)}` });
    } catch (error) {
      return healthcheck.down({ message: error instanceof Error ? error.message : String(error) });
    }
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    let timeout: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
          timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
        }),
      ]);
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
