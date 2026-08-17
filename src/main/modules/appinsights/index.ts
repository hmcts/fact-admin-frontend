import process from 'node:process';

import { useAzureMonitor } from 'applicationinsights';
import config from 'config';

import { Logger } from '../logging';

export class AppInsights {
  enable(): void {
    let appInsightsConnectionString: string | undefined;
    if (process.env.APP_INSIGHTS_CONNECTION_STRING) {
      appInsightsConnectionString = process.env.APP_INSIGHTS_CONNECTION_STRING;
    } else if (config.get('secrets.fact-kv.APP_INSIGHTS_CONNECTION_STRING')) {
      appInsightsConnectionString = config.get('secrets.fact-kv.APP_INSIGHTS_CONNECTION_STRING');
    }

    if (appInsightsConnectionString) {
      process.env.OTEL_SERVICE_NAME ||= 'fact-admin-frontend';

      const options = {
        azureMonitorExporterOptions: {
          connectionString: appInsightsConnectionString,
        },
      };

      useAzureMonitor(options);

      Logger.getLogger('app').info('App insights activated');
    }
  }
}
