import { Logger } from '@hmcts/nodejs-logging';
import { InjectionMode, asFunction, asValue, createContainer } from 'awilix';
import { Application } from 'express';

import { ProfessionalInformationService } from '../../services/ProfessionalInformationService';

const logger = Logger.getLogger('app');

export class Container {
  public enableFor(app: Application): void {
    app.locals.container = createContainer({
      injectionMode: InjectionMode.CLASSIC,
    }).register({
      logger: asValue(logger),
      professionalInformationService: asFunction(() => new ProfessionalInformationService()).scoped(),
    });
  }
}
