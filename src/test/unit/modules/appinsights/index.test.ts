const useAzureMonitor = jest.fn();
const info = jest.fn();
const getConfig = jest.fn();

jest.mock('applicationinsights', () => ({
  useAzureMonitor,
}));

jest.mock('config', () => ({
  get: getConfig,
}));

jest.mock('../../../../main/modules/logging', () => ({
  Logger: {
    getLogger: jest.fn().mockReturnValue({ info }),
  },
}));

import { AppInsights } from '../../../../main/modules/appinsights';

describe('AppInsights', () => {
  const originalConnectionString = process.env.APP_INSIGHTS_CONNECTION_STRING;
  const originalServiceName = process.env.OTEL_SERVICE_NAME;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.APP_INSIGHTS_CONNECTION_STRING;
    delete process.env.OTEL_SERVICE_NAME;
    getConfig.mockReturnValue('');
  });

  afterAll(() => {
    restoreEnvironmentVariable('APP_INSIGHTS_CONNECTION_STRING', originalConnectionString);
    restoreEnvironmentVariable('OTEL_SERVICE_NAME', originalServiceName);
  });

  test('starts Azure Monitor with the environment connection string and service name', () => {
    process.env.APP_INSIGHTS_CONNECTION_STRING = 'InstrumentationKey=test';

    new AppInsights().enable();

    expect(process.env.OTEL_SERVICE_NAME).toBe('fact-admin-frontend');
    expect(useAzureMonitor).toHaveBeenCalledWith({
      azureMonitorExporterOptions: {
        connectionString: 'InstrumentationKey=test',
      },
    });
    expect(info).toHaveBeenCalledWith('App insights activated');
  });

  test('uses the configured Key Vault connection string as a fallback', () => {
    getConfig.mockReturnValue('InstrumentationKey=key-vault');

    new AppInsights().enable();

    expect(useAzureMonitor).toHaveBeenCalledWith({
      azureMonitorExporterOptions: {
        connectionString: 'InstrumentationKey=key-vault',
      },
    });
  });

  test('does not start Azure Monitor without a connection string', () => {
    new AppInsights().enable();

    expect(useAzureMonitor).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
  });
});

function restoreEnvironmentVariable(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
