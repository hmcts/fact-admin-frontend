import process from 'process';

import { defaultClient, setup } from 'applicationinsights';
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
      setup(appInsightsConnectionString).setSendLiveMetrics(true).start();

      defaultClient.context.tags[defaultClient.context.keys.cloudRole] = 'fact-admin-frontend';
      defaultClient.trackTrace({
        message: 'App insights activated',
      });
    }
  }
}
