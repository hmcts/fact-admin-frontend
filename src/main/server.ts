#!/usr/bin/env node

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';

import config from 'config';

import { app } from './app';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('server');

let server: http.Server | https.Server | null = null;
let shutdownStarted = false;

// used by shutdownCheck in readinessChecks
app.locals.shutdown = false;

// TODO: set the right port for your application
const port: number = parseInt(process.env.PORT || '3355', 10);

const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';

if (!developmentMode) {
  // force the client credential env vars to be set from config, rather than the deployment
  // environment, as we don't have control over that in k8s environments.
  process.env.AZURE_CLIENT_ID = config.get('secrets.fact-kv.FRONTEND_APP_REG_ID');
  process.env.AZURE_CLIENT_SECRET = config.get('secrets.fact-kv.FRONTEND_APP_REG_SECRET');
}

if (app.locals.ENV === 'development') {
  const sslDirectory = path.join(__dirname, 'resources', 'localhost-ssl');
  const sslOptions = {
    cert: fs.readFileSync(path.join(sslDirectory, 'localhost.crt')),
    key: fs.readFileSync(path.join(sslDirectory, 'localhost.key')),
  };
  server = https.createServer(sslOptions, app);
  server.listen(port, () => {
    logger.info(`Application started: https://localhost:${port}`);
  });
} else {
  server = app.listen(port, () => {
    logger.info(`Application started: http://localhost:${port}`);
  });
}

function gracefulShutdownHandler(signal: string) {
  if (shutdownStarted) {
    return;
  }

  shutdownStarted = true;
  logger.info(`⚠️ Caught ${signal}, gracefully shutting down. Setting readiness to DOWN`);
  // stop the server from accepting new connections
  app.locals.shutdown = true;

  const shutdownDelayMs = developmentMode ? 0 : 4000;
  const forceExitTimer = setTimeout(() => {
    logger.info('Forcing process exit after shutdown timeout');
    process.exit(0);
  }, shutdownDelayMs + 5000);

  setTimeout(() => {
    logger.info('Shutting down application');
    if (!server) {
      clearTimeout(forceExitTimer);
      process.exit(0);
    }

    server.close(() => {
      logger.info('Server closed');
      clearTimeout(forceExitTimer);
      process.exit(0);
    });
  }, shutdownDelayMs);
}

process.on('SIGINT', gracefulShutdownHandler);
process.on('SIGTERM', gracefulShutdownHandler);
