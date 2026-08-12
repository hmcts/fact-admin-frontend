import process from 'node:process';

import { useAzureMonitor } from '@azure/monitor-opentelemetry';
import { Logger } from '@hmcts/nodejs-logging';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import config from 'config';

export class AppInsights {
  enable(): void {
    let appInsightsConnectionString: string | undefined;
    if (process.env.APP_INSIGHTS_CONNECTION_STRING) {
      appInsightsConnectionString = process.env.APP_INSIGHTS_CONNECTION_STRING;
    } else if (config.get('secrets.fact-kv.APP_INSIGHTS_CONNECTION_STRING')) {
      appInsightsConnectionString = config.get('secrets.fact-kv.APP_INSIGHTS_CONNECTION_STRING');
    }

    if (appInsightsConnectionString) {
      const customResource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'fact-admin-frontend',
      });

      const options = {
        resource: customResource,
        azureMonitorExporterOptions: {
          connectionString: appInsightsConnectionString,
        },
      };

      useAzureMonitor(options);

      Logger.getLogger('app').info('App insights activated');
    }
  }
}
