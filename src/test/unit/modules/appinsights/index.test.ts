const sdk = {
  setAutoCollectRequests: jest.fn().mockReturnThis(),
  setAutoCollectPerformance: jest.fn().mockReturnThis(),
  setAutoCollectExceptions: jest.fn().mockReturnThis(),
  setAutoCollectDependencies: jest.fn().mockReturnThis(),
  setAutoCollectConsole: jest.fn().mockReturnThis(),
  setAutoCollectPreAggregatedMetrics: jest.fn().mockReturnThis(),
  setSendLiveMetrics: jest.fn().mockReturnThis(),
  setInternalLogging: jest.fn().mockReturnThis(),
  enableWebInstrumentation: jest.fn().mockReturnThis(),
  start: jest.fn(),
};
const defaultClient = {
  config: {} as Record<string, unknown>,
};
const setup = jest.fn().mockReturnValue(sdk);
const getConfig = jest.fn();

jest.mock('applicationinsights', () => ({
  defaultClient,
  setup,
}));

jest.mock('config', () => ({
  get: getConfig,
}));

import { AppInsights } from '../../../../main/modules/appinsights';

describe('AppInsights', () => {
  const originalConnectionString = process.env.APP_INSIGHTS_CONNECTION_STRING;
  const originalServiceName = process.env.OTEL_SERVICE_NAME;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.APP_INSIGHTS_CONNECTION_STRING;
    delete process.env.OTEL_SERVICE_NAME;
    defaultClient.config = {};
    getConfig.mockReturnValue('');
  });

  afterAll(() => {
    restoreEnvironmentVariable('APP_INSIGHTS_CONNECTION_STRING', originalConnectionString);
    restoreEnvironmentVariable('OTEL_SERVICE_NAME', originalServiceName);
  });

  test('starts Azure Monitor with the environment connection string and service name', () => {
    process.env.APP_INSIGHTS_CONNECTION_STRING = 'InstrumentationKey=test';
    sdk.start.mockImplementationOnce(() => {
      expect(defaultClient.config.azureMonitorOpenTelemetryOptions).toBeDefined();
    });

    const enabled = new AppInsights().enable();

    expect(enabled).toBe(true);
    expect(process.env.OTEL_SERVICE_NAME).toBe('fact-admin-frontend');
    expect(setup).toHaveBeenCalledWith('InstrumentationKey=test');
    expect(defaultClient.config.azureMonitorOpenTelemetryOptions).toEqual({
      instrumentationOptions: {
        http: {
          enabled: true,
          ignoreIncomingRequestHook: expect.any(Function),
        },
      },
    });
    expect(sdk.setAutoCollectRequests).toHaveBeenCalledWith(true);
    expect(sdk.setAutoCollectPerformance).toHaveBeenCalledWith(true, false);
    expect(sdk.setAutoCollectConsole).toHaveBeenCalledWith(true, false);
    expect(sdk.setSendLiveMetrics).toHaveBeenCalledWith(false);
    expect(sdk.start).toHaveBeenCalled();

    const options = defaultClient.config.azureMonitorOpenTelemetryOptions as {
      instrumentationOptions: { http: { ignoreIncomingRequestHook: (request: { url?: string }) => boolean } };
    };
    const { ignoreIncomingRequestHook } = options.instrumentationOptions.http;
    expect(ignoreIncomingRequestHook({ url: '/health/liveness' })).toBe(true);
    expect(ignoreIncomingRequestHook({ url: '/health/readiness?probe=true' })).toBe(true);
    expect(ignoreIncomingRequestHook({ url: '/health' })).toBe(false);
    expect(ignoreIncomingRequestHook({ url: '/courts' })).toBe(false);
  });

  test('uses the configured Key Vault connection string as a fallback', () => {
    getConfig.mockReturnValue('InstrumentationKey=key-vault');

    const enabled = new AppInsights().enable();

    expect(enabled).toBe(true);
    expect(setup).toHaveBeenCalledWith('InstrumentationKey=key-vault');
    expect(sdk.start).toHaveBeenCalled();
  });

  test('does not start Azure Monitor without a connection string', () => {
    const enabled = new AppInsights().enable();

    expect(enabled).toBe(false);
    expect(setup).not.toHaveBeenCalled();
    expect(sdk.start).not.toHaveBeenCalled();
  });
});

function restoreEnvironmentVariable(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
