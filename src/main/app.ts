import * as path from 'path';

import { Logger } from '@hmcts/nodejs-logging';
import { loadControllers, scopePerRequest } from 'awilix-express';
import * as bodyParser from 'body-parser';
import config from 'config';
import cookieParser from 'cookie-parser';
import express from 'express';
import { requiresAuth } from 'express-openid-connect';
import RateLimit from 'express-rate-limit';

import { HTTPError } from './HttpError';
import { setupDev } from './development';
import { AppInsights } from './modules/appinsights';
import { Authentication } from './modules/authentication';
import { getFactUser, getFactUserId, isAdmin, isSuperAdmin } from './modules/authentication/authenticationHelper';
import { Container } from './modules/awilix';
import { Helmet } from './modules/helmet';
import { Nunjucks } from './modules/nunjucks';
import { PropertiesVolume } from './modules/properties-volume';
import { RedisModule } from './modules/redis/RedisModule';
import { runWithDataApiUserId } from './requests/utils/dataApiRequestContext';

const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';

const limiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});

const publicRoutes = ['/health', '/info', '/favicon.ico', '/sso/login', '/sso/return', '/sso/logout'];
const adminRoutes = ['/', '/download', '/add-court', '/courts', '/service-centres'];
const superAdminRoutes = ['/audits', '/users'];

export const app = express();
app.locals.ENV = env;

const logger = Logger.getLogger('app');

new PropertiesVolume().enableFor(app);
new AppInsights().enable();
new Nunjucks(developmentMode).enableFor(app);
// secure the application by adding various HTTP headers to its responses
new Helmet(config.get('security'), developmentMode).enableFor(app);
new Container().enableFor(app);
new RedisModule(logger).enableFor(app);

app.use(scopePerRequest(app.locals.container));

app.get('/favicon.ico', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/assets/rebrand/images/favicon.ico'));
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(loadControllers('controllers/{HealthController,InfoController}.+(ts|js)', { cwd: __dirname }));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
  next();
});

new Authentication().enableFor(app);

app.use((req, _res, next) => {
  runWithDataApiUserId(getFactUserId(req), next);
});

const requireAuthenticated = requiresAuth();

app.use((req, res, next) => {
  res.locals.isSuperAdmin = false;

  if (matchesRoute(req.path, publicRoutes)) {
    return next();
  }

  return requireAuthenticated(req, res, err => {
    if (err) {
      return next(err);
    }

    res.locals.isSuperAdmin = isSuperAdmin(req);

    if (matchesRoute(req.path, superAdminRoutes)) {
      return isSuperAdmin(req) ? next() : denyAccess(req, res);
    }

    if (matchesRoute(req.path, adminRoutes)) {
      return isAdmin(req) ? next() : denyAccess(req, res);
    }

    res.status(404);
    return res.render('not-found');
  });
});

app.use(loadControllers('controllers/**/*.+(ts|js)', { cwd: __dirname }));

setupDev(app, developmentMode);
// returning "not found" page for requests with paths not resolved by the router
app.use((req, res) => {
  res.status(404);
  res.render('not-found');
});

// error handler
app.use((err: HTTPError, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(`${err.stack || err}`);

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = env === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

function matchesRoute(urlPath: string, routes: string[]): boolean {
  return routes.some(route => urlPath === route || urlPath.startsWith(`${route}/`));
}

function denyAccess(req: express.Request, res: express.Response): void {
  const factUser = getFactUser(req);
  logger.warn(
    `Access denied: method=${req.method} path=${req.originalUrl} userId=${factUser?.id ?? 'unknown'} role=${factUser?.role ?? 'unknown'}`
  );
  res.status(403).render('access-denied');
}
