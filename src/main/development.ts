import * as express from 'express';
import webpack from 'webpack';
import type { Configuration } from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

const setupDev = (app: express.Express, developmentMode: boolean): void => {
  if (developmentMode) {
    const webpackConfig = require('../../webpack.config') as Configuration;
    const compiler = webpack(webpackConfig);
    app.use(
      webpackDevMiddleware(compiler, {
        publicPath: '/',
      })
    );
  }
};

export { setupDev };
