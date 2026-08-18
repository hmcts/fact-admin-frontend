import process from 'node:process';

import * as appInsights from 'applicationinsights';
import config from 'config';

export class AppInsights {
  enable(): boolean {
    let appInsightsConnectionString: string | undefined;
    if (process.env.APP_INSIGHTS_CONNECTION_STRING) {
      appInsightsConnectionString = process.env.APP_INSIGHTS_CONNECTION_STRING;
    } else if (config.get('secrets.fact-kv.APP_INSIGHTS_CONNECTION_STRING')) {
      appInsightsConnectionString = config.get('secrets.fact-kv.APP_INSIGHTS_CONNECTION_STRING');
    }

    if (appInsightsConnectionString) {
      process.env.OTEL_SERVICE_NAME ||= 'fact-admin-frontend';

      const sdk = appInsights.setup(appInsightsConnectionString);
      const httpInstrumentationOptions = {
        enabled: true,
        ignoreIncomingRequestHook: (request: { url?: string }) => {
          const path = request.url?.split('?', 1)[0];
          return path === '/health/liveness' || path === '/health/readiness';
        },
      };

      appInsights.defaultClient.config.azureMonitorOpenTelemetryOptions = {
        instrumentationOptions: {
          http: httpInstrumentationOptions,
        },
      };

      sdk
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, false)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true, false)
        .setAutoCollectPreAggregatedMetrics(true)
        .setSendLiveMetrics(false)
        .setInternalLogging(false, true)
        .enableWebInstrumentation(false)
        .start();

      return true;
    }

    return false;
  }
}
