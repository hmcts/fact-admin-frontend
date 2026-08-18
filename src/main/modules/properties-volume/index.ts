import * as propertiesVolume from '@hmcts/properties-volume';
import config from 'config';
import { get, set } from 'lodash';

export class PropertiesVolume {
  enable(): void {
    if ((process.env.NODE_ENV || 'development') !== 'development') {
      propertiesVolume.addTo(config);

      this.setSecret('secrets.fact-kv.APP_INSIGHTS_CONNECTION_STRING', 'appInsights.app-insights-connection-string');
    }
  }

  private setSecret(fromPath: string, toPath: string): void {
    if (config.has(fromPath)) {
      set(config, toPath, get(config, fromPath));
    }
  }
}
