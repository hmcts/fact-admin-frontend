import { Logger } from '@hmcts/nodejs-logging';
import { InjectionMode, asValue, createContainer } from 'awilix';
import { Application } from 'express';

const logger = Logger.getLogger('app');

export class Container {
  public enableFor(app: Application): void {
    app.locals.container = createContainer({
      injectionMode: InjectionMode.CLASSIC,
    }).register({
      logger: asValue(logger),
    });
  }
}
