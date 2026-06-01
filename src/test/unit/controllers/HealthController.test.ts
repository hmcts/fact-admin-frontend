import { Response } from 'express';
import { assert, match, mock, stub } from 'sinon';
import type { SinonStub } from 'sinon';

const healthcheck = {
  raw: stub().callsFake((fn: () => unknown) => fn),
  up: stub().returns({ status: 'UP' }),
  down: stub().returns({ status: 'DOWN' }),
};

const healthRoutes = {
  configure: stub(),
  checkReadiness: stub(),
};

const outputs = {
  UP: 'UP',
  status: stub().callsFake((value: string) => ({ status: value })),
};

const mockRedisPing = jest.fn().mockResolvedValue('PONG');

jest.mock('@hmcts/nodejs-healthcheck', () => healthcheck);
jest.mock('@hmcts/nodejs-healthcheck/healthcheck/routes', () => healthRoutes);
jest.mock('@hmcts/nodejs-healthcheck/healthcheck/outputs', () => outputs);
jest.mock('../../../main/app', () => ({
  app: {
    locals: {
      redisClient: {
        ping: mockRedisPing,
      },
      shutdown: false,
    },
  },
}));

import { app } from '../../../main/app';
import HealthController from '../../../main/controllers/HealthController';

let configureHandler: SinonStub;
let readinessHandler: SinonStub;
let configureMock: SinonStub;
let checkReadinessMock: SinonStub;
let statusMock: SinonStub;
let rawMock: SinonStub;
let upMock: SinonStub;
let downMock: SinonStub;

describe('HealthController', () => {
  beforeEach(() => {
    configureHandler = stub();
    readinessHandler = stub();

    healthRoutes.configure.callsFake(() => configureHandler);
    healthRoutes.checkReadiness.callsFake(() => readinessHandler);

    configureMock = healthRoutes.configure;
    checkReadinessMock = healthRoutes.checkReadiness;
    statusMock = outputs.status;
    rawMock = healthcheck.raw;
    upMock = healthcheck.up;
    downMock = healthcheck.down;

    mockRedisPing.mockReset();
    mockRedisPing.mockResolvedValue('PONG');
    app.locals.redisClient = {
      ping: mockRedisPing,
    };
    app.locals.shutdown = false;

    configureHandler.resetHistory();
    readinessHandler.resetHistory();
    configureMock.resetHistory();
    checkReadinessMock.resetHistory();
    statusMock.resetHistory();
    rawMock.resetHistory();
    upMock.resetHistory();
    downMock.resetHistory();
  });

  test('delegates /health to healthcheck routes', () => {
    const controller = new HealthController();
    const request = {} as never;
    const response = {} as never;

    controller.get(request, response);

    assert.calledWithMatch(configureMock, {
      checks: match.object,
      readinessChecks: match.object,
    });
    assert.calledWith(configureHandler, request, response);
  });

  test('includes Redis in health checks', async () => {
    const controller = new HealthController();

    controller.get({} as never, {} as never);

    const config = configureMock.firstCall.args[0];
    await expect(config.checks.redis()).resolves.toEqual({ status: 'UP' });
  });

  test('returns Redis down when ping times out', async () => {
    jest.useFakeTimers();
    mockRedisPing.mockReturnValue(new Promise(() => undefined));

    const controller = new HealthController();
    controller.get({} as never, {} as never);

    const config = configureMock.firstCall.args[0];
    const result = config.checks.redis();

    jest.advanceTimersByTime(2000);

    await expect(result).resolves.toEqual({ status: 'DOWN' });
    assert.calledWithMatch(downMock, { message: 'Redis ping timed out after 2000ms' });

    jest.useRealTimers();
  });

  test('returns liveness status', () => {
    const controller = new HealthController();
    const response = {
      json: () => '',
    } as unknown as Response;
    const responseMock = mock(response);

    responseMock.expects('json').once().withArgs({ status: 'UP' });
    controller.liveness({} as never, response);

    assert.calledWith(statusMock, 'UP');
    responseMock.verify();
  });

  test('delegates /health/readiness to readiness checks', () => {
    const controller = new HealthController();
    const request = {} as never;
    const response = {} as never;

    controller.readiness(request, response);

    assert.calledWithMatch(checkReadinessMock, match.object);
    assert.calledWith(readinessHandler, request, response);
  });
});
